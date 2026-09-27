import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from seed_data import seed_database

# Ensure database is seeded for tests
seed_database()
client = TestClient(app)

def test_health_and_metrics():
    """Verify Day 5 Observability & Health endpoints."""
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "UP"

    metrics_res = client.get("/metrics")
    assert metrics_res.status_code == 200
    assert metrics_res.json()["total_posts"] >= 8

def test_public_read_access_without_login():
    """Verify that unauthenticated users can freely list and read articles."""
    res = client.get("/api/v1/posts")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert len(data["items"]) >= 8
    assert data["total"] >= 8

    # Fetch first post
    first_post_id = data["items"][0]["id"]
    detail_res = client.get(f"/api/v1/posts/{first_post_id}")
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert "content" in detail_data
    assert "comments" in detail_data

def test_auth_login_and_jwt_tokens():
    """Verify Day 3 Authentication & JWT Token Issuance."""
    # Test valid credentials
    res = client.post("/api/v1/auth/login", json={
        "username": "dr_elena",
        "password": "Author@123"
    })
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["username"] == "dr_elena"

    # Test invalid credentials
    invalid_res = client.post("/api/v1/auth/login", json={
        "username": "dr_elena",
        "password": "WrongPassword!"
    })
    assert invalid_res.status_code == 401

def test_rbac_and_resource_ownership():
    """
    Verify Day 3 & Day 5 RBAC & Ownership:
    - Reader cannot author articles (403)
    - Author can create articles
    - Non-owner cannot update someone else's article (403)
    """
    # 1. Login as Reader
    reader_login = client.post("/api/v1/auth/login", json={
        "username": "alex_reader",
        "password": "Reader@123"
    }).json()
    reader_token = reader_login["access_token"]

    # Reader attempts to create post -> Forbidden (403)
    post_payload = {
        "title": "Reader Attempting To Publish Article Directly",
        "category": "Data Engineering",
        "excerpt": "This should be blocked by RBAC dependencies.",
        "content": "Full text of unauthorized post attempting to bypass least privilege."
    }
    create_as_reader = client.post(
        "/api/v1/posts",
        json=post_payload,
        headers={"Authorization": f"Bearer {reader_token}"}
    )
    assert create_as_reader.status_code == 403

    # 2. Login as Author
    author_login = client.post("/api/v1/auth/login", json={
        "username": "marcus_chen",
        "password": "Author@123"
    }).json()
    author_token = author_login["access_token"]

    # Author creates post -> Success (201)
    author_post_payload = {
        "title": "Triton Compiler Passes for Accelerated Attention Kernels",
        "category": "LLM Infrastructure",
        "tags": "Triton,CUDA,Compilation",
        "read_time_minutes": 6,
        "excerpt": "Dissecting custom fused kernel compilation in Triton for PyTorch 2.x.",
        "content": "Detailed engineering article content exploring block layouts, shared memory, and warp synchronization."
    }
    create_res = client.post(
        "/api/v1/posts",
        json=author_post_payload,
        headers={"Authorization": f"Bearer {author_token}"}
    )
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # 3. Another user attempts to modify this post -> Forbidden (403)
    elena_login = client.post("/api/v1/auth/login", json={
        "username": "dr_elena",
        "password": "Author@123"
    }).json()
    elena_token = elena_login["access_token"]

    update_res = client.put(
        f"/api/v1/posts/{created_id}",
        json={"title": "Hacked Title Attempt"},
        headers={"Authorization": f"Bearer {elena_token}"}
    )
    assert update_res.status_code == 403

    # 4. Marcus (owner) updates his own post -> Success (200)
    owner_update = client.put(
        f"/api/v1/posts/{created_id}",
        json={"title": "Triton Compiler Passes for Accelerated Attention Kernels (v2 Revised)"},
        headers={"Authorization": f"Bearer {author_token}"}
    )
    assert owner_update.status_code == 200
    assert owner_update.json()["title"] == "Triton Compiler Passes for Accelerated Attention Kernels (v2 Revised)"

def test_commenting_and_liking():
    """Verify that logged in users can like and comment on articles."""
    # Login as reader
    reader_login = client.post("/api/v1/auth/login", json={
        "username": "alex_reader",
        "password": "Reader@123"
    }).json()
    token = reader_login["access_token"]

    # Get a post ID
    posts = client.get("/api/v1/posts").json()["items"]
    post_id = posts[0]["id"]

    # Like toggle
    like_res = client.post(
        f"/api/v1/posts/{post_id}/likes/toggle",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert like_res.status_code == 200
    assert "liked" in like_res.json()

    # Add comment
    comment_res = client.post(
        f"/api/v1/posts/{post_id}/comments",
        json={"content": "Excellent automated test verification of discussion threads!"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert comment_res.status_code == 201
    comment_data = comment_res.json()
    assert comment_data["content"] == "Excellent automated test verification of discussion threads!"

def test_data_exports():
    """Verify Day 4 Data Exporting in CSV and Markdown formats."""
    # CSV Catalog Export
    csv_res = client.get("/api/v1/export/posts/csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "attachment; filename=nexusai_articles_catalog.csv" in csv_res.headers["content-disposition"]
    assert "ID,Title,Slug,Category,Author" in csv_res.text

    # Markdown Export
    posts = client.get("/api/v1/posts").json()["items"]
    post_id = posts[0]["id"]
    md_res = client.get(f"/api/v1/export/posts/{post_id}/markdown")
    assert md_res.status_code == 200
    assert "text/markdown" in md_res.headers["content-type"]
    assert "---" in md_res.text  # YAML frontmatter present
