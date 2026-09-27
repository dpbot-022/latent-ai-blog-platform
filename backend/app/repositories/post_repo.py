from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, or_, desc, asc
from backend.app.models.post import Post
from backend.app.models.comment import Comment
from backend.app.models.like import Like

class PostRepository:
    @staticmethod
    def get_by_id(db: Session, post_id: int) -> Optional[Post]:
        return db.query(Post).options(
            joinedload(Post.author),
            selectinload(Post.comments).joinedload(Comment.author),
            selectinload(Post.likes)
        ).filter(Post.id == post_id).first()

    @staticmethod
    def get_by_slug(db: Session, slug: str) -> Optional[Post]:
        return db.query(Post).options(
            joinedload(Post.author),
            selectinload(Post.comments).joinedload(Comment.author),
            selectinload(Post.likes)
        ).filter(Post.slug == slug).first()

    @staticmethod
    def list_posts(
        db: Session,
        skip: int = 0,
        limit: int = 12,
        category: Optional[str] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        author_id: Optional[int] = None,
        is_published: Optional[bool] = True,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Tuple[List[Post], int]:
        """
        Retrieves paginated posts with eager loading of author and pre-calculated like/comment counts.
        Prevents N+1 queries.
        """
        query = db.query(Post).options(
            joinedload(Post.author),
            selectinload(Post.likes),
            selectinload(Post.comments)
        )

        if is_published is not None:
            query = query.filter(Post.is_published == is_published)

        if category:
            query = query.filter(Post.category.ilike(f"%{category}%"))

        if tag:
            query = query.filter(Post.tags.ilike(f"%{tag}%"))

        if author_id:
            query = query.filter(Post.author_id == author_id)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Post.title.ilike(search_pattern),
                    Post.excerpt.ilike(search_pattern),
                    Post.content.ilike(search_pattern),
                    Post.tags.ilike(search_pattern)
                )
            )

        total = query.count()

        # Sorting logic
        if sort_by == "likes":
            # Sort by count of likes
            query = query.outerjoin(Like).group_by(Post.id)
            if sort_order == "asc":
                query = query.order_by(asc(func.count(Like.id)))
            else:
                query = query.order_by(desc(func.count(Like.id)), desc(Post.created_at))
        elif sort_by == "read_time":
            order_func = asc if sort_order == "asc" else desc
            query = query.order_by(order_func(Post.read_time_minutes))
        elif sort_by == "views":
            order_func = asc if sort_order == "asc" else desc
            query = query.order_by(order_func(Post.views_count))
        else:
            order_func = asc if sort_order == "asc" else desc
            query = query.order_by(order_func(Post.created_at))

        items = query.offset(skip).limit(limit).all()
        return items, total

    @staticmethod
    def create(db: Session, post: Post) -> Post:
        db.add(post)
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def update(db: Session, post: Post) -> Post:
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    def delete(db: Session, post: Post) -> None:
        db.delete(post)
        db.commit()

    @staticmethod
    def increment_views(db: Session, post_id: int) -> None:
        db.query(Post).filter(Post.id == post_id).update(
            {Post.views_count: Post.views_count + 1}
        )
        db.commit()

    @staticmethod
    def count_all(db: Session) -> int:
        return db.query(Post).count()

    @staticmethod
    def count_by_categories(db: Session) -> dict[str, int]:
        results = db.query(Post.category, func.count(Post.id)).group_by(Post.category).all()
        return {cat: count for cat, count in results}
