# LATENT — Production Architecture & System Specifications

> **System Specification Document (SSD) & Developer Reference**  
> *Author: Dhruv Pathak • LATENT Engineering Platform*

---

## 1. High-Level Architectural Philosophy

**LATENT** is built strictly following the **Clean Layered Architecture (MVC / Separation of Concerns)** pattern. Unlike conventional monolithic FastAPI projects that intermingle SQL queries inside HTTP handlers, LATENT enforces four decoupled tiers:

```
┌────────────────────────────────────────────────────────┐
│               Client Tier (Vanilla ES6)                │
│       Responsive 3-Column Glassmorphic Workspace       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON / Multipart
                            ▼
┌────────────────────────────────────────────────────────┐
│       Presentation / Router Tier (Controllers)        │
│       • Request Validation (Pydantic v2)               │
│       • Auth & RBAC Dependencies Guard                 │
│       • HTTP Response Serialization                    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            Business Logic Tier (Services)              │
│       • PostService, AuthService, CommentService       │
│       • EmailService (Live SMTP / Gmail STARTTLS)       │
│       • ExportService (RFC 4180 CSV & Frontmatter MD)   │
│       • ExternalAIService (Resilient LLM Analysis)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Data Access Tier (Repositories - DAL)         │
│       • UserRepository, PostRepository                 │
│       • CommentRepository, LikeRepository              │
│       • AuditRepository                                │
└───────────────────────────┬────────────────────────────┘
                            │ SQLAlchemy 2.0 ORM
                            ▼
┌────────────────────────────────────────────────────────┐
│         Database Engine (SQLite WAL / Postgres)        │
│       • Compound Indexes on (category, created_at)     │
│       • Immediate Checkpointed WAL Concurrency         │
└────────────────────────────────────────────────────────┘
```

### Key Architectural Tenets:
1. **Controller Purity**: Routers only handle request unpacking, status codes, and dependency injection.
2. **Business Isolation**: Domain rules (e.g. read time calculation, slug collision handling, OTP generation, RBAC checks) live solely in the Service layer.
3. **Storage Independence**: The repository layer isolates raw SQLAlchemy ORM queries, enabling frictionless migration between SQLite and PostgreSQL.
4. **Zero Client Secret Leakage**: Passwords, hashes, and OTP codes are strictly excluded from API response schemas.

---

## 2. Core Middleware Pipeline

Requests traverse an enterprise-grade middleware pipeline before reaching route handlers:

```
Incoming Request
       │
       ▼
┌────────────────────────────────────────┐
│ 1. GZip Middleware (Payload > 1000B)   │ ── Reduces network egress by up to 70%
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 2. CORS Middleware                     │ ── Cross-Origin Resource Sharing control
└──────────────────┬─────────────────────┘
                   │
                   ▼
┌────────────────────────────────────────┐
│ 3. Observability & Rate Limiting       │
│    • In-Memory Sliding Window (120/m)  │ ── Throttles abusive requests with 429
│    • High-Resolution Perf Timer        │ ── Injects `X-Process-Time-Ms`
│    • Telemetry Registry Updates        │ ── Tracks total requests & latency
└──────────────────┬─────────────────────┘
                   │
                   ▼
         API Router / Endpoint
```

---

## 3. Security, Authentication & Dynamic OTP Flow

### 3.1 Password Security & JWT
* **Password Hashing**: `bcrypt` with automatic salting (rounds=12).
* **Stateless Tokens**: RFC 7519 JSON Web Tokens (HS256) signed with a 256-bit secret key, encoded with standard `sub` (User ID) and expiration timestamps.

### 3.2 Dynamic Email OTP Verification Pipeline
When a new user registers or an unverified user logs in:
1. An unverified user record is provisioned with `is_verified = False`.
2. A cryptographically secure 6-digit OTP is generated using `secrets.randbelow()`.
3. The OTP and a 10-minute UTC expiry timestamp (`otp_expires_at`) are saved to the user record.
4. **Live SMTP Dispatch**:
   * If `SMTP_USER` and `SMTP_PASSWORD` are configured (e.g., Gmail App Password), an `EmailMessage` with HTML and plain-text fallback is dispatched over TLS port 587.
   * If credentials are not supplied, the code is logged strictly to the secure server console (never returned in HTTP response schemas).
5. The client submits the code to `POST /api/v1/auth/verify-otp`. Upon successful match, `is_verified` becomes `True`, and a signed JWT bearer token is issued.

---

## 4. Role-Based Access Control (RBAC) & Multi-Tenancy

LATENT enforces three distinct roles defined in `UserRole`:

| Capability | READER | AUTHOR | ADMIN |
| :--- | :---: | :---: | :---: |
| Browse & Read Articles | ✅ | ✅ | ✅ |
| Search, Filter & Sort Feed | ✅ | ✅ | ✅ |
| Export Catalog to CSV / Markdown | ✅ | ✅ | ✅ |
| Like & Unlike Articles | ✅ | ✅ | ✅ |
| Comment in Discussions | ✅ | ✅ | ✅ |
| Follow / Unfollow Authors | ✅ | ✅ | ✅ |
| Access Author Studio ("Write") | ❌ | ✅ | ✅ |
| Upload Cover Images | ❌ | ✅ | ✅ |
| Create & Publish Stories | ❌ | ✅ | ✅ |
| Edit & Delete **Own** Articles | ❌ | ✅ | ✅ |
| Edit & Delete **Any** Article | ❌ | ❌ | ✅ |
| Delete Any Comment | ❌ | ❌ | ✅ |
| Inspect Container `/metrics` & Uptime | ✅ (Public) | ✅ (Public) | ✅ (Public) |
| Inspect Security Audit Trail | ❌ | ❌ | ✅ |

### Tenant Ownership Enforcement:
Every modifying operation (`PUT /posts/{id}`, `DELETE /posts/{id}`, `DELETE /comments/{id}`) evaluates:
```python
if resource.author_id != current_user.id and current_user.role != UserRole.ADMIN:
    raise HTTPException(status_code=403, detail="Access denied: You do not own this resource.")
```

---

## 5. Media Pipeline & Cover Image Handling

* **Dedicated Upload Endpoint**: `POST /api/v1/posts/upload-cover` accepting `multipart/form-data`.
* **Validation**:
  * MIME type / file extension whitelist: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`.
  * Maximum size limit: 5MB.
* **Storage & Collision Prevention**: Files are saved with a UUID4 hash name (`uuid.uuid4().hex.<ext>`) in `frontend/uploads/` and served statically via `/uploads/<filename>`.
* **Frontend Dropzone**: Drag-and-drop file picker with immediate local preview (`URL.createObjectURL`), live progress feedback, change image, and remove controls.

---

## 6. Complete REST API Specifications

### 6.1 Authentication & Profile
* `POST /api/v1/auth/register` — Registers new account (`201 Created`).
* `POST /api/v1/auth/login` — Authenticates credentials. Returns JWT token or `requires_otp: true` (`200 OK`).
* `POST /api/v1/auth/verify-otp` — Verifies 6-digit OTP code and activates account (`200 OK`).
* `POST /api/v1/auth/resend-otp` — Dispatches fresh OTP code to registered email (`200 OK`).
* `GET /api/v1/auth/me` — Fetches current authenticated user profile (`200 OK`).

### 6.2 Articles & Publications
* `GET /api/v1/posts` — Paginated list of published articles with filters (`page`, `limit`, `category`, `tag`, `search`, `sort_by`, `sort_order`).
* `GET /api/v1/posts/authors/published` — Returns all authors who have published at least one blog (powers dynamic "Who to Follow").
* `GET /api/v1/posts/user/my-posts` — Returns all articles authored by the logged-in user.
* `GET /api/v1/posts/{id_or_slug}` — Fetches full article details, rendered content, and increments view counter.
* `POST /api/v1/posts` — Creates and publishes a new article (Requires `AUTHOR` or `ADMIN`).
* `PUT /api/v1/posts/{id}` — Updates an article (Owner or `ADMIN`).
* `DELETE /api/v1/posts/{id}` — Deletes an article (Owner or `ADMIN`).
* `POST /api/v1/posts/upload-cover` — Multipart cover image upload.

### 6.3 Engagement & Social
* `POST /api/v1/posts/{id}/likes/toggle` — Toggles like/unlike state with live counter.
* `GET /api/v1/posts/{id}/likes/status` — Checks user's like state and count.
* `GET /api/v1/posts/{id}/comments` — Lists discussion comments for an article.
* `POST /api/v1/posts/{id}/comments` — Posts a comment (Authenticated).
* `DELETE /api/v1/comments/{id}` — Deletes a comment (Owner or `ADMIN`).

### 6.4 Data Exports & Observability
* `GET /api/v1/export/posts/csv` — Streams complete catalog as RFC 4180 CSV (`latent_articles_catalog.csv`).
* `GET /api/v1/export/posts/{id}/markdown` — Exports article as Markdown with YAML frontmatter.
* `GET /api/v1/export/posts/json` — JSON payload dump for downstream ML/AI pipelines.
* `GET /health` — Kubernetes/Docker container health probe.
* `GET /metrics` — Request throughput, uptime, and average processing latency telemetry.
* `GET /api/v1/system/audit-logs` — Immutable administrative security audit trail (`ADMIN`).
* `POST /api/v1/system/analyze-draft` — Simulated external LLM analyzer for draft complexity and automated tagging.

---

## 7. Database Entity-Relationship Design

```
┌──────────────────────────┐             ┌──────────────────────────┐
│          users           │ 1         * │          posts           │
├──────────────────────────┤────────────<│──────────────────────────┤
│ id (PK, Integer)         │             │ id (PK, Integer)         │
│ username (Unique, Indx)  │             │ title (String 255)       │
│ email (Unique, Indx)     │             │ slug (Unique, Indx)      │
│ hashed_password (String) │             │ excerpt (Text)           │
│ full_name (String)       │             │ content (Text)           │
│ role (Enum)              │             │ cover_image (String)     │
│ is_verified (Boolean)    │             │ category (String, Indx)  │
│ otp_code (String 6)      │             │ tags (String)            │
│ otp_expires_at (DateTime)│             │ views_count (Integer)    │
│ created_at (DateTime)    │             │ is_published (Boolean)   │
└────────────┬─────────────┘             │ author_id (FK -> users)  │
             │                           │ created_at (DateTime)    │
             │ 1                         └────────────┬─────────────┘
             │                                        │ 1
             │ *                                      │
┌────────────▼─────────────┐             ┌────────────▼─────────────┐
│          likes           │             │         comments         │
├──────────────────────────┤             ├──────────────────────────┤
│ id (PK, Integer)         │             │ id (PK, Integer)         │
│ user_id (FK -> users)    │             │ post_id (FK -> posts)    │
│ post_id (FK -> posts)    │             │ author_id (FK -> users)  │
│ created_at (DateTime)    │             │ content (Text)           │
└──────────────────────────┘             │ created_at (DateTime)    │
                                         └──────────────────────────┘
```

---

## 8. Development & Management Scripts

* `python run.py`: Boots the FastAPI server with auto-seeding on `http://localhost:8000`.
* `python clean_test_users.py`: Safely clears temporary validation users while preserving all technical articles.
* `pytest -v`: Executes the 9-gate integration and unit test suite.
