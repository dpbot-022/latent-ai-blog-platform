# LATENT — Production-Grade AI Engineering Publication Platform

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688.svg)](https://fastapi.tiangolo.com)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20Layered%20MVC-7952B3.svg)](#system-architecture)
[![RBAC](https://img.shields.io/badge/Security-JWT%20%7C%20RBAC%20%7C%20Bcrypt-orange.svg)](#authentication--rbac)
[![Docker](https://img.shields.io/badge/Containers-Docker%20%26%20Compose-2496ED.svg)](#containerized-deployment)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions%20Passing-success.svg)](#continuous-integration)

> **Production-Grade AI Engineering Bootcamp — Week 1 Assignment Solution**  
> A high-performance, user-specific technical publication platform where anyone can browse and read published blogs without logging in, while authenticated users can create and manage their own blogs, and other logged-in users can like and comment on posts.

---

## 🌟 Executive Summary & USP (Unique Selling Proposition)

Most blog platforms are built as monolithic CRUD prototypes with tightly coupled database logic, unprotected endpoints, and generic UI templates. 

**LATENT sets a high production bar by delivering an enterprise-ready publication ecosystem:**

1. **Clean Layered (MVC) Architecture**: Strict separation of concerns between HTTP Routers (Controllers), Business Services, Repositories (Data Access Layer), and Declarative Models, preventing vendor lock-in and maximizing testability.
2. **Multi-Tenant Resource Ownership & RBAC**: True tenant data isolation where users have exclusive control over their articles and discussions. Enforces three strict roles: `READER`, `AUTHOR`, and `ADMIN`.
3. **Database Performance & N+1 Query Elimination**: Pre-compiled compound indexes, SQLite Write-Ahead Logging (WAL) concurrency, and SQLAlchemy eager relationship joins (`joinedload` / `selectinload`) to prevent N+1 query bottlenecks.
4. **Data Handling & Export Engine**: Native multipart/form-data upload pipeline with file validation and automated multi-format data exports (RFC 4180 CSV catalog stream and Git-backed Markdown with YAML frontmatter).
5. **Production Telemetry & Observability**: Real-time `/health` container probes, granular `/metrics` tracking average latency and request throughput, alongside an immutable `AuditLog` security trail.
6. **High-Aesthetic Editorial UI**: Modern responsive 3-column panel grid, glassmorphic navigation, light/dark theme persistence, and **8 publication-quality technical deep dives** on Hybrid RAG, vLLM PagedAttention, Apache Iceberg Lakehouses, and Real-Time Stream Processing pre-seeded into the platform.

---

## 🏛️ System Architecture

```
                                  ┌────────────────────────────────┐
                                  │      Client Web Interface      │
                                  │ (Vanilla ES6, HTML5, CSS Vars) │
                                  └───────────────┬────────────────┘
                                                  │ HTTP / JSON / Multipart
                                                  ▼
                                  ┌────────────────────────────────┐
                                  │   FastAPI Core Engine (v1)     │
                                  ├────────────────────────────────┤
                                  │ • Observability & Latency MW   │
                                  │ • In-Memory Rate Limiting MW   │
                                  │ • GZip Payload Compression MW  │
                                  │ • CORS Security Middleware     │
                                  └───────────────┬────────────────┘
                                                  │
                 ┌────────────────────────────────┴───────────────────────────────┐
                 │                                                                │
                 ▼                                                                ▼
      ┌─────────────────────┐                                          ┌─────────────────────┐
      │   Public Endpoints  │                                          │ Authenticated Guard │
      ├─────────────────────┤                                          ├─────────────────────┤
      │ • GET /api/v1/posts │                                          │ • JWT Bearer Auth   │
      │ • GET /posts/{slug} │                                          │ • RBAC Guard        │
      │ • GET /health       │                                          │ • Tenant Ownership  │
      │ • GET /metrics      │                                          └──────────┬──────────┘
      └──────────┬──────────┘                                                     │
                 │                                                                │
                 └────────────────────────┬───────────────────────────────────────┘
                                          ▼
                               ┌─────────────────────┐
                               │    Service Layer    │
                               ├─────────────────────┤
                               │ • AuthService       │
                               │ • PostService       │
                               │ • CommentService    │
                               │ • ExportService     │
                               │ • ExternalAIService │
                               └──────────┬──────────┘
                                          ▼
                               ┌─────────────────────┐
                               │  Repository Layer   │
                               │ (Decoupled DAL)     │
                               ├─────────────────────┤
                               │ • UserRepository    │
                               │ • PostRepository    │
                               │ • CommentRepository │
                               │ • LikeRepository    │
                               │ • AuditRepository   │
                               └──────────┬──────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │   SQLite WAL / PostgreSQL       │
                         │   Indexed Schemas & Relations   │
                         └─────────────────────────────────┘
```

---

## 📅 Bootcamp Curriculum Day-by-Day Alignment

| Bootcamp Day | Core Concept | Production Implementation in LATENT |
| :--- | :--- | :--- |
| **Day 1** | Foundations & SDLC | Modular directory hierarchy, Git conventional commits, `.env.example`, `.gitignore`, client-server decoupling, and HTTP lifecycle. |
| **Day 2** | MVC & REST API Design | Controller routers (`routers/`), business services (`services/`), data access repositories (`repositories/`), pagination, filtering, sorting, and external AI analysis with retries/timeouts. |
| **Day 3** | Auth & Multi-Tenancy | Salted `bcrypt` password hashing (rounds=12), stateless JWT tokens (HS256), strict tenant resource ownership, and configurable CORS middleware. |
| **Day 4** | File Uploads & DB Optimization | Multipart cover image uploads with size/type validation, CSV and Markdown exports, compound indexes on `(category, created_at)`, eager loading to eliminate N+1 queries, GZip compression, and sliding-window rate limiting. |
| **Day 5** | RBAC & Observability | Fine-grained roles (`READER`, `AUTHOR`, `ADMIN`), security audit logging table, `/health` container probes, `/metrics` latency analytics, `Dockerfile`, `docker-compose.yml`, and GitHub Actions CI. |

---

## ⚡ Quick Start Guide (Local Execution)

### Prerequisites
- Python 3.10+ (tested on Python 3.12 and 3.14)
- Git

### Step 1: Clone Repository & Set Up Virtual Environment
```bash
git clone <your-public-repo-url>
cd production-ai-blog-platform

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### Step 2: Install Production Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Run the Application
```bash
python run.py
```
*The root runner will automatically initialize the database schema and populate the 8 comprehensive technical deep-dive articles.*

Open **[http://localhost:8000](http://localhost:8000)** in your browser!
- **Web Application**: `http://localhost:8000`
- **Interactive Swagger REST Docs**: `http://localhost:8000/docs`
- **Alternative ReDoc Specification**: `http://localhost:8000/redoc`
- **Health Check Probe**: `http://localhost:8000/health`
- **Observability Metrics**: `http://localhost:8000/metrics`

---

## 🐳 Containerized Deployment (Docker Compose)

Run the entire application in an isolated, production-grade container with automated health check probes:

```bash
docker compose up --build -d
```
Inspect container health:
```bash
docker ps --filter "name=latent-platform"
```

---

## 🔐 Default Demo Accounts Matrix

The platform is pre-seeded with real users across all three RBAC roles:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `Admin@123` | Full access: View all telemetry, manage all articles, delete any comment, inspect audit trail. |
| **AUTHOR** | `dr_elena` | `Author@123` | Authoring access: Create, edit, and delete own articles, upload cover media, like, and comment. |
| **AUTHOR** | `marcus_chen` | `Author@123` | Authoring access: Create, edit, and delete own articles, upload cover media, like, and comment. |
| **READER** | `alex_reader` | `Reader@123` | Reading & engagement access: Browse articles, search, like, participate in discussions. |

---

## 🧪 Automated Test Suite

Execute the comprehensive test gate verifying authentication, RBAC authorization, CRUD operations, liking, commenting, and data exports:

```bash
pytest -v
```

**Test Coverage Highlights:**
- ✅ `test_health_and_metrics`: Validates system health and latency telemetry.
- ✅ `test_public_read_access_without_login`: Guarantees anonymous visitors can browse and read full articles.
- ✅ `test_auth_login_and_jwt_tokens`: Validates bcrypt verification and JWT claims.
- ✅ `test_rbac_and_resource_ownership`: Enforces that Readers cannot author, and authors cannot edit others' posts.
- ✅ `test_commenting_and_liking`: Validates discussion threads and like toggle state.
- ✅ `test_data_exports`: Validates RFC 4180 CSV streams and Markdown frontmatter exports.

---

## 📡 REST API Contract Summary

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/posts` | Public | Paginated list of published articles with category, search, and sort filters. |
| `GET` | `/api/v1/posts/{id_or_slug}` | Public | Full article details with comments and view increment. |
| `POST` | `/api/v1/posts` | Author / Admin | Create and publish a new technical article. |
| `PUT` | `/api/v1/posts/{id}` | Owner / Admin | Modify an existing article (enforces resource ownership). |
| `DELETE` | `/api/v1/posts/{id}` | Owner / Admin | Delete an article. |
| `POST` | `/api/v1/posts/upload-cover` | Authenticated | Multipart/form-data cover image upload with validation. |
| `POST` | `/api/v1/posts/{id}/likes/toggle`| Authenticated | Toggle like/unlike state with live counter. |
| `GET` | `/api/v1/posts/{id}/likes/status`| Public | Check current user like status and total likes. |
| `GET` | `/api/v1/posts/{id}/comments` | Public | Retrieve discussion comments for an article. |
| `POST` | `/api/v1/posts/{id}/comments` | Authenticated | Add a comment to an article. |
| `DELETE`| `/api/v1/comments/{id}` | Owner / Admin | Delete a comment. |
| `GET` | `/api/v1/export/posts/csv` | Public | Stream complete catalog as RFC 4180 CSV. |
| `GET` | `/api/v1/export/posts/{id}/markdown` | Public | Export article as Markdown with YAML frontmatter. |
| `GET` | `/health` | Public | Kubernetes/Docker health probe. |
| `GET` | `/metrics` | Public | Latency and throughput observability metrics. |
| `GET` | `/api/v1/system/audit-logs` | Author / Admin | Security and administrative audit trail. |

---

## 📄 License
This project is open-source and licensed under the MIT License.
