import csv
import io
import json
from typing import List
from backend.app.models.post import Post

class ExportService:
    @staticmethod
    def export_posts_to_csv(posts: List[Post]) -> str:
        """
        Generates RFC 4180 compliant CSV stream containing all posts and metadata.
        """
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        
        # Write Header
        writer.writerow([
            "ID", "Title", "Slug", "Category", "Author", "Read Time (Mins)",
            "Views", "Likes", "Comments", "Tags", "Created At"
        ])
        
        for post in posts:
            writer.writerow([
                post.id,
                post.title,
                post.slug,
                post.category,
                post.author.full_name or post.author.username if post.author else "Unknown",
                post.read_time_minutes,
                post.views_count,
                len(post.likes) if post.likes else 0,
                len(post.comments) if post.comments else 0,
                post.tags or "",
                post.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
            
        return output.getvalue()

    @staticmethod
    def export_post_to_markdown(post: Post) -> str:
        """
        Generates standard Markdown with YAML frontmatter suitable for Git-backed SSGs (Hugo, Astro, Jekyll).
        """
        author_name = post.author.full_name or post.author.username if post.author else "Anonymous"
        tags_list = [t.strip() for t in (post.tags or "").split(",") if t.strip()]
        tags_formatted = json.dumps(tags_list)

        frontmatter = f"""---
title: "{post.title.replace('"', '\\"')}"
slug: "{post.slug}"
author: "{author_name}"
category: "{post.category}"
tags: {tags_formatted}
read_time_minutes: {post.read_time_minutes}
created_at: "{post.created_at.isoformat()}"
views: {post.views_count}
---

# {post.title}

> *Published by {author_name} in **{post.category}** • {post.read_time_minutes} min read*

![Cover Image]({post.cover_image})

**Executive Summary:** {post.excerpt}

---

{post.content}

---
*Exported from NexusAI Production Platform*
"""
        return frontmatter
