from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.repositories.post_repo import PostRepository
from backend.app.services.export_service import ExportService
from backend.app.services.post_service import PostService

router = APIRouter(prefix="/export", tags=["Export & Data Handling"])

@router.get("/posts/csv")
def export_posts_csv(db: Session = Depends(get_db)):
    """
    Day 4: Exporting Data - Generates and returns an RFC 4180 CSV export of all published articles.
    """
    posts, _ = PostRepository.list_posts(db=db, skip=0, limit=1000, is_published=True)
    csv_content = ExportService.export_posts_to_csv(posts)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=latent_articles_catalog.csv"
        }
    )

@router.get("/posts/{post_id}/markdown")
def export_post_markdown(post_id: int, db: Session = Depends(get_db)):
    """
    Day 4: Exporting Data - Generates a standardized Markdown document with YAML frontmatter.
    """
    post = PostRepository.get_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found.")

    md_content = ExportService.export_post_to_markdown(post)
    filename = f"{post.slug}.md"

    return Response(
        content=md_content,
        media_type="text/markdown",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/posts/json")
def export_posts_json(db: Session = Depends(get_db)):
    """
    Day 4: Exporting Data - Generates comprehensive JSON dataset of articles for downstream AI pipelines.
    """
    posts, total = PostRepository.list_posts(db=db, skip=0, limit=1000, is_published=True)
    return {
        "platform": "LATENT",
        "total_records": total,
        "articles": [PostService.to_summary_response(p) for p in posts]
    }

