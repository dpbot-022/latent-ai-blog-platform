from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), index=True, nullable=False)
    slug = Column(String(220), unique=True, index=True, nullable=False)
    excerpt = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)
    cover_image = Column(String(500), nullable=True)
    category = Column(String(50), index=True, nullable=False)
    tags = Column(String(200), nullable=True)  # Comma-separated: "RAG,VectorDB,LLM"
    read_time_minutes = Column(Integer, default=5, nullable=False)
    is_published = Column(Boolean, default=True, index=True, nullable=False)
    views_count = Column(Integer, default=0, nullable=False)
    
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    author = relationship("User", back_populates="posts")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan", order_by="desc(Comment.created_at)")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_posts_category_created", "category", "created_at"),
        Index("ix_posts_author_created", "author_id", "created_at"),
    )
