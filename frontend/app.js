/**
 * NexusAI Application Client Logic
 * Production-Grade Multi-Tenant Architecture with JWT, RBAC & Markdown Engine
 */

// Application Global State
const state = {
  token: localStorage.getItem("nexus_token") || null,
  user: null,
  theme: localStorage.getItem("nexus_theme") || "dark",
  currentCategory: "",
  searchQuery: "",
  sortBy: "created_at",
  sortOrder: "desc",
  currentPage: 1,
  limit: 12,
  currentReadingPost: null,
  userLikedPostIds: new Set()
};

// DOM References Cache
const dom = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  authNavContainer: document.getElementById("authNavContainer"),
  articlesGrid: document.getElementById("articlesGrid"),
  categoryPills: document.getElementById("categoryPills"),
  sortBySelect: document.getElementById("sortBySelect"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  resultsCount: document.getElementById("resultsCount"),
  brandHomeBtn: document.getElementById("brandHomeBtn"),
  // Modals
  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  tabLoginBtn: document.getElementById("tabLoginBtn"),
  tabRegisterBtn: document.getElementById("tabRegisterBtn"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginErrorMsg: document.getElementById("loginErrorMsg"),
  registerErrorMsg: document.getElementById("registerErrorMsg"),
  // Reader Modal
  readerModal: document.getElementById("readerModal"),
  closeReaderBtn: document.getElementById("closeReaderBtn"),
  readerArticleContent: document.getElementById("readerArticleContent"),
  readerLikeBtn: document.getElementById("readerLikeBtn"),
  readerLikeCount: document.getElementById("readerLikeCount"),
  readerMarkdownExportBtn: document.getElementById("readerMarkdownExportBtn"),
  commentComposerContainer: document.getElementById("commentComposerContainer"),
  readerCommentsList: document.getElementById("readerCommentsList"),
  readerCommentsCount: document.getElementById("readerCommentsCount"),
  // Editor Studio Modal
  editorModal: document.getElementById("editorModal"),
  closeEditorModalBtn: document.getElementById("closeEditorModalBtn"),
  postEditorForm: document.getElementById("postEditorForm"),
  editorModalTitle: document.getElementById("editorModalTitle"),
  editPostId: document.getElementById("editPostId"),
  postTitle: document.getElementById("postTitle"),
  postCategory: document.getElementById("postCategory"),
  postTags: document.getElementById("postTags"),
  postReadTime: document.getElementById("postReadTime"),
  postCoverUrl: document.getElementById("postCoverUrl"),
  coverFileInput: document.getElementById("coverFileInput"),
  uploadStatusText: document.getElementById("uploadStatusText"),
  postExcerpt: document.getElementById("postExcerpt"),
  postContent: document.getElementById("postContent"),
  editorWriteTabBtn: document.getElementById("editorWriteTabBtn"),
  editorPreviewTabBtn: document.getElementById("editorPreviewTabBtn"),
  editorWritePane: document.getElementById("editorWritePane"),
  editorPreviewPane: document.getElementById("editorPreviewPane"),
  aiAssistBtn: document.getElementById("aiAssistBtn"),
  cancelEditorBtn: document.getElementById("cancelEditorBtn"),
  editorErrorMsg: document.getElementById("editorErrorMsg"),
  // My Posts Modal
  myPostsModal: document.getElementById("myPostsModal"),
  closeMyPostsModalBtn: document.getElementById("closeMyPostsModalBtn"),
  myPostsList: document.getElementById("myPostsList"),
  // Observability & System Modal
  systemModal: document.getElementById("systemModal"),
  closeSystemModalBtn: document.getElementById("closeSystemModalBtn"),
  systemMetricsBtn: document.getElementById("systemMetricsBtn"),
  exportAllCsvBtn: document.getElementById("exportAllCsvBtn"),
  metricHealthStatus: document.getElementById("metricHealthStatus"),
  metricDbStatus: document.getElementById("metricDbStatus"),
  metricUptime: document.getElementById("metricUptime"),
  metricReqCount: document.getElementById("metricReqCount"),
  metricAvgLatency: document.getElementById("metricAvgLatency"),
  metricPostsCount: document.getElementById("metricPostsCount"),
  auditLogsBody: document.getElementById("auditLogsBody"),
  // Hero stats
  heroTotalPosts: document.getElementById("heroTotalPosts"),
  heroTotalLikes: document.getElementById("heroTotalLikes"),
  heroTotalComments: document.getElementById("heroTotalComments"),
  toastContainer: document.getElementById("toastContainer")
};

// ============================================================================
// Notification Toast System
// ============================================================================
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(30px)";
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ============================================================================
// API Service Wrapper
// ============================================================================
async function apiRequest(endpoint, options = {}) {
  const headers = options.headers || {};
  if (state.token) {
    headers["Authorization"] = `Bearer ${state.token}`;
  }
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(endpoint, { ...options, headers });
  
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
}

// ============================================================================
// Theme Management
// ============================================================================
function initTheme() {
  dom.html.setAttribute("data-theme", state.theme);
  dom.themeToggleBtn.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    dom.html.setAttribute("data-theme", state.theme);
    localStorage.setItem("nexus_theme", state.theme);
  });
}

// ============================================================================
// Authentication Flow & Navigation State
// ============================================================================
async function initAuth() {
  if (state.token) {
    try {
      state.user = await apiRequest("/api/v1/auth/me");
    } catch (err) {
      console.warn("Session expired or invalid:", err.message);
      logout();
    }
  }
  renderAuthNav();
}

function renderAuthNav() {
  if (state.user) {
    // Authenticated User State
    const canCreate = (state.user.role === "AUTHOR" || state.user.role === "ADMIN");
    dom.authNavContainer.innerHTML = `
      <div class="auth-buttons-group">
        ${canCreate ? `
          <button class="primary-btn" id="headerNewArticleBtn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span class="btn-text-responsive">Write Article</span>
          </button>
        ` : ''}
        
        <div class="user-profile-menu">
          <div class="user-chip" id="userMenuToggleBtn">
            <img src="${state.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + state.user.username}" class="user-avatar-img" alt="Avatar">
            <span class="user-chip-name">${state.user.full_name || state.user.username}</span>
            <span class="role-badge-pill">${state.user.role}</span>
          </div>

          <div class="user-dropdown-menu" id="userDropdownMenu">
            ${canCreate ? `
              <a href="#" class="dropdown-item" id="navMyArticlesBtn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                My Articles
              </a>
            ` : ''}
            <div class="dropdown-divider"></div>
            <a href="#" class="dropdown-item" id="navLogoutBtn" style="color: var(--danger-color);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </a>
          </div>
        </div>
      </div>
    `;

    // Dropdown listeners
    const toggleBtn = document.getElementById("userMenuToggleBtn");
    const dropdown = document.getElementById("userDropdownMenu");
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });
    document.addEventListener("click", () => dropdown.classList.remove("active"));

    const newBtn = document.getElementById("headerNewArticleBtn");
    if (newBtn) {
      newBtn.addEventListener("click", () => openEditorModal());
    }

    const myArtBtn = document.getElementById("navMyArticlesBtn");
    if (myArtBtn) {
      myArtBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openMyPostsModal();
      });
    }

    document.getElementById("navLogoutBtn").addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });

  } else {
    // Unauthenticated Guest State
    dom.authNavContainer.innerHTML = `
      <div class="auth-buttons-group">
        <button class="secondary-btn" id="openSignInBtn">Sign In</button>
        <button class="primary-btn" id="openSignUpBtn">Get Started</button>
      </div>
    `;
    document.getElementById("openSignInBtn").addEventListener("click", () => openAuthModal("login"));
    document.getElementById("openSignUpBtn").addEventListener("click", () => openAuthModal("register"));
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem("nexus_token");
  renderAuthNav();
  loadArticles();
  showToast("You have been signed out.", "info");
}

// ============================================================================
// Articles Panel Grid Loading & Rendering
// ============================================================================
async function loadArticles() {
  dom.articlesGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Retrieving peer-reviewed technical articles...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams({
      page: state.currentPage,
      limit: state.limit,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    });

    if (state.currentCategory) params.append("category", state.currentCategory);
    if (state.searchQuery) params.append("search", state.searchQuery);

    const data = await apiRequest(`/api/v1/posts?${params.toString()}`);
    renderArticlesGrid(data.items);
    dom.resultsCount.textContent = `Showing ${data.total} articles`;
    
    // Update hero stats
    if (dom.heroTotalPosts) dom.heroTotalPosts.textContent = data.total;

  } catch (err) {
    dom.articlesGrid.innerHTML = `
      <div class="loading-state">
        <p style="color: var(--danger-color)">Error loading articles: ${err.message}</p>
        <button class="secondary-btn" onclick="loadArticles()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

function renderArticlesGrid(posts) {
  if (!posts || posts.length === 0) {
    dom.articlesGrid.innerHTML = `
      <div class="loading-state">
        <p>No engineering articles found matching criteria.</p>
        <button class="secondary-btn" onclick="resetFilters()" style="margin-top: 1rem;">Clear Filters</button>
      </div>
    `;
    return;
  }

  dom.articlesGrid.innerHTML = posts.map(post => {
    const tags = (post.tags || "").split(",").filter(t => t.trim()).slice(0, 3);
    const pubDate = new Date(post.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const isLiked = state.userLikedPostIds.has(post.id);

    return `
      <article class="article-panel-card" data-post-id="${post.id}">
        <!-- Cover Image with Overlaid Badges -->
        <div class="panel-image-wrapper">
          <img src="${post.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'}" 
               alt="${escapeHtml(post.title)}" 
               class="panel-cover-img"
               loading="lazy"
               onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'">
          <div class="panel-image-overlay">
            <span class="panel-cat-badge">${escapeHtml(post.category)}</span>
            <span class="panel-readtime-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${post.read_time_minutes} min read
            </span>
          </div>
        </div>

        <!-- Panel Content -->
        <div class="panel-content">
          <h3 class="panel-title">${escapeHtml(post.title)}</h3>
          <p class="panel-excerpt">${escapeHtml(post.excerpt)}</p>

          <!-- Technical Tag Badges -->
          <div class="panel-tags-row">
            ${tags.map(tag => `<span class="panel-tag">#${escapeHtml(tag.trim())}</span>`).join("")}
          </div>

          <!-- Author Attribution -->
          <div class="panel-author-row">
            <img src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.author.username}" class="panel-author-avatar" alt="Author">
            <div class="panel-author-details">
              <span class="panel-author-name">${escapeHtml(post.author.full_name || post.author.username)}</span>
              <span class="panel-pub-date">${pubDate}</span>
            </div>
          </div>

          <!-- Engagement Footer -->
          <div class="panel-footer-actions">
            <div class="engagement-metrics">
              <button class="like-btn ${isLiked ? 'liked' : ''}" data-like-id="${post.id}" title="Like this article">
                <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="like-count">${post.likes_count}</span>
              </button>

              <div class="comment-metric" title="Peer discussions">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>${post.comments_count}</span>
              </div>
            </div>

            <span class="read-more-link">
              Read Paper
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  // Attach card click handlers for reader modal
  document.querySelectorAll(".article-panel-card").forEach(card => {
    card.addEventListener("click", (e) => {
      // Don't trigger if user clicked like button specifically
      if (e.target.closest(".like-btn")) return;
      const postId = card.getAttribute("data-post-id");
      openReaderModal(postId);
    });
  });

  // Attach like button handlers
  document.querySelectorAll(".like-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const postId = btn.getAttribute("data-like-id");
      await handleLikeToggle(postId, btn);
    });
  });
}

function resetFilters() {
  state.currentCategory = "";
  state.searchQuery = "";
  dom.globalSearchInput.value = "";
  document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
  document.querySelector(".cat-pill[data-category='']").classList.add("active");
  loadArticles();
}

// ============================================================================
// Engagement: Like Toggle with Optimistic UI
// ============================================================================
async function handleLikeToggle(postId, btnElement) {
  if (!state.user) {
    showToast("Please sign in to like this article.", "info");
    openAuthModal("login");
    return;
  }

  const countSpan = btnElement.querySelector(".like-count") || dom.readerLikeCount;
  const currentCount = parseInt(countSpan.textContent || "0");
  const wasLiked = btnElement.classList.contains("liked");

  // Optimistic UI update
  if (wasLiked) {
    btnElement.classList.remove("liked");
    countSpan.textContent = Math.max(0, currentCount - 1);
    state.userLikedPostIds.delete(parseInt(postId));
  } else {
    btnElement.classList.add("liked");
    countSpan.textContent = currentCount + 1;
    state.userLikedPostIds.add(parseInt(postId));
  }

  try {
    const res = await apiRequest(`/api/v1/posts/${postId}/likes/toggle`, { method: "POST" });
    countSpan.textContent = res.likes_count;
    if (res.liked) {
      btnElement.classList.add("liked");
      state.userLikedPostIds.add(parseInt(postId));
    } else {
      btnElement.classList.remove("liked");
      state.userLikedPostIds.delete(parseInt(postId));
    }
  } catch (err) {
    // Revert on error
    countSpan.textContent = currentCount;
    if (wasLiked) btnElement.classList.add("liked");
    else btnElement.classList.remove("liked");
    showToast(err.message, "error");
  }
}

// ============================================================================
// Full Article Reader Modal
// ============================================================================
async function openReaderModal(postIdOrSlug) {
  dom.readerModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.readerArticleContent.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Rendering article and mathematical schemas...</p>
    </div>
  `;

  try {
    const post = await apiRequest(`/api/v1/posts/${postIdOrSlug}`);
    state.currentReadingPost = post;

    const pubDate = new Date(post.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    // Check like status
    let hasLiked = false;
    try {
      const statusRes = await apiRequest(`/api/v1/posts/${post.id}/likes/status`);
      hasLiked = statusRes.has_liked;
    } catch (_) {}

    dom.readerLikeCount.textContent = post.likes_count;
    if (hasLiked) {
      dom.readerLikeBtn.classList.add("liked");
      state.userLikedPostIds.add(post.id);
    } else {
      dom.readerLikeBtn.classList.remove("liked");
      state.userLikedPostIds.delete(post.id);
    }

    // Render Article Header, Metadata, and Markdown Body
    dom.readerArticleContent.innerHTML = `
      <div class="reader-header-area">
        <div class="reader-meta-pills">
          <span class="panel-cat-badge">${escapeHtml(post.category)}</span>
          <span class="panel-readtime-badge">${post.read_time_minutes} min read</span>
          <span class="panel-tag" style="margin-left: auto;">${post.views_count} views</span>
        </div>
        <h1 class="reader-title">${escapeHtml(post.title)}</h1>
        
        <div class="reader-author-box">
          <img src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.author.username}" class="reader-author-avatar" alt="Author">
          <div class="reader-author-info">
            <h4>${escapeHtml(post.author.full_name || post.author.username)}</h4>
            <div class="reader-author-bio">${escapeHtml(post.author.role)} • Published on ${pubDate}</div>
          </div>
        </div>

        ${post.cover_image ? `
          <img src="${post.cover_image}" alt="${escapeHtml(post.title)}" class="reader-cover-image">
        ` : ''}

        <!-- Executive Summary Callout -->
        <div class="guest-callout-box" style="text-align: left; margin-bottom: 2rem; border-left: 4px solid var(--accent-primary);">
          <strong>Executive Summary:</strong>
          <p style="margin-top: 0.35rem; margin-bottom: 0;">${escapeHtml(post.excerpt)}</p>
        </div>
      </div>

      <!-- Markdown Prose -->
      <div class="reader-prose">
        ${renderMarkdown(post.content)}
      </div>
    `;

    // Render Comments
    renderCommentsSection(post);

  } catch (err) {
    dom.readerArticleContent.innerHTML = `
      <div class="loading-state">
        <p style="color: var(--danger-color)">Error loading article: ${err.message}</p>
      </div>
    `;
  }
}

function closeReaderModal() {
  dom.readerModal.classList.remove("active");
  document.body.style.overflow = "";
  state.currentReadingPost = null;
  // Refresh articles grid to sync views and likes
  loadArticles();
}

dom.closeReaderBtn.addEventListener("click", closeReaderModal);
dom.readerModal.addEventListener("click", (e) => {
  if (e.target === dom.readerModal) closeReaderModal();
});

dom.readerLikeBtn.addEventListener("click", () => {
  if (state.currentReadingPost) {
    handleLikeToggle(state.currentReadingPost.id, dom.readerLikeBtn);
  }
});

dom.readerMarkdownExportBtn.addEventListener("click", () => {
  if (state.currentReadingPost) {
    window.location.href = `/api/v1/export/posts/${state.currentReadingPost.id}/markdown`;
    showToast("Exporting article as Markdown...", "success");
  }
});

// ============================================================================
// Comments & Discussions System
// ============================================================================
function renderCommentsSection(post) {
  dom.readerCommentsCount.textContent = post.comments ? post.comments.length : 0;

  if (state.user) {
    // Authenticated Comment Form
    dom.commentComposerContainer.innerHTML = `
      <form id="addCommentForm" class="composer-form">
        <textarea id="commentTextInput" class="composer-textarea" rows="3" placeholder="Contribute to this technical discussion..." required minlength="2"></textarea>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="primary-btn">Post Comment</button>
        </div>
      </form>
    `;

    document.getElementById("addCommentForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const textInput = document.getElementById("commentTextInput");
      const content = textInput.value.trim();
      if (!content) return;

      try {
        const newComment = await apiRequest(`/api/v1/posts/${post.id}/comments`, {
          method: "POST",
          body: JSON.stringify({ content })
        });
        textInput.value = "";
        showToast("Comment published!", "success");

        // Prepend new comment
        post.comments = [newComment, ...(post.comments || [])];
        renderCommentsList(post.comments, post.author_id);
        dom.readerCommentsCount.textContent = post.comments.length;
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } else {
    // Guest Callout
    dom.commentComposerContainer.innerHTML = `
      <div class="guest-callout-box">
        <p>Sign in to like this article and join the technical discussion with authors.</p>
        <button class="primary-btn" onclick="openAuthModal('login')">Sign In to Comment</button>
      </div>
    `;
  }

  renderCommentsList(post.comments || [], post.author_id);
}

function renderCommentsList(comments, postAuthorId) {
  if (!comments || comments.length === 0) {
    dom.readerCommentsList.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem;">
        No comments yet. Be the first to share an engineering perspective!
      </p>
    `;
    return;
  }

  dom.readerCommentsList.innerHTML = comments.map(c => {
    const timeStr = new Date(c.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const canDelete = state.user && (
      state.user.id === c.author_id || 
      state.user.id === postAuthorId || 
      state.user.role === "ADMIN"
    );

    return `
      <div class="comment-item" id="comment-${c.id}">
        <div class="comment-header">
          <div class="comment-author-badge">
            <img src="${c.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + c.author.username}" alt="Avatar">
            <span class="comment-author-name">${escapeHtml(c.author.full_name || c.author.username)}</span>
            <span class="role-badge-pill" style="font-size: 0.65rem;">${c.author.role}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="comment-time">${timeStr}</span>
            ${canDelete ? `
              <button class="delete-comment-btn" onclick="deleteComment(${c.id})" title="Delete Comment">
                Delete
              </button>
            ` : ''}
          </div>
        </div>
        <div class="comment-body">${escapeHtml(c.content)}</div>
      </div>
    `;
  }).join("");
}

window.deleteComment = async function(commentId) {
  if (!confirm("Are you sure you want to delete this comment?")) return;
  try {
    await apiRequest(`/api/v1/comments/${commentId}`, { method: "DELETE" });
    const el = document.getElementById(`comment-${commentId}`);
    if (el) el.remove();
    showToast("Comment deleted", "info");
    const count = parseInt(dom.readerCommentsCount.textContent || "1");
    dom.readerCommentsCount.textContent = Math.max(0, count - 1);
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ============================================================================
// Author Studio: Create & Edit Articles
// ============================================================================
function openEditorModal(post = null) {
  dom.editorModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.editorErrorMsg.style.display = "none";

  if (post) {
    dom.editorModalTitle.textContent = "Author Studio: Edit Article";
    dom.editPostId.value = post.id;
    dom.postTitle.value = post.title;
    dom.postCategory.value = post.category;
    dom.postTags.value = post.tags || "";
    dom.postReadTime.value = post.read_time_minutes;
    dom.postCoverUrl.value = post.cover_image || "";
    dom.postExcerpt.value = post.excerpt;
    dom.postContent.value = post.content;
  } else {
    dom.editorModalTitle.textContent = "Author Studio: New Technical Article";
    dom.postEditorForm.reset();
    dom.editPostId.value = "";
    dom.postReadTime.value = 7;
    dom.postCoverUrl.value = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
  }
}

function closeEditorModal() {
  dom.editorModal.classList.remove("active");
  document.body.style.overflow = "";
}

dom.closeEditorModalBtn.addEventListener("click", closeEditorModal);
dom.cancelEditorBtn.addEventListener("click", closeEditorModal);

// Markdown write / preview tab switcher
dom.editorWriteTabBtn.addEventListener("click", () => {
  dom.editorWriteTabBtn.classList.add("active");
  dom.editorPreviewTabBtn.classList.remove("active");
  dom.editorWritePane.style.display = "block";
  dom.editorPreviewPane.style.display = "none";
});

dom.editorPreviewTabBtn.addEventListener("click", () => {
  dom.editorPreviewTabBtn.classList.add("active");
  dom.editorWriteTabBtn.classList.remove("active");
  dom.editorWritePane.style.display = "none";
  dom.editorPreviewPane.style.display = "block";
  dom.editorPreviewPane.innerHTML = renderMarkdown(dom.postContent.value);
});

// Day 4: File Upload handler for Cover Image
dom.coverFileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  dom.uploadStatusText.textContent = `Uploading ${file.name}...`;
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await apiRequest("/api/v1/posts/upload-cover", {
      method: "POST",
      body: formData
    });
    dom.postCoverUrl.value = res.url;
    dom.uploadStatusText.textContent = `Uploaded successfully (${Math.round(res.size_bytes / 1024)} KB)`;
    showToast("Cover image uploaded!", "success");
  } catch (err) {
    dom.uploadStatusText.textContent = `Upload failed: ${err.message}`;
    showToast(err.message, "error");
  }
});

// Day 2: External AI Draft Assistant
dom.aiAssistBtn.addEventListener("click", async () => {
  const title = dom.postTitle.value.trim();
  const content = dom.postContent.value.trim();

  if (!title || content.length < 20) {
    showToast("Please provide an article title and at least 20 characters of content first.", "info");
    return;
  }

  dom.aiAssistBtn.innerHTML = `Analyzing Draft...`;
  try {
    const analysis = await apiRequest("/api/v1/system/analyze-draft", {
      method: "POST",
      body: JSON.stringify({ title, content })
    });
    dom.postTags.value = analysis.suggested_tags.join(", ");
    showToast(`AI Analysis complete! Suggested tags and complexity: ${analysis.complexity_grade}`, "success");
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    dom.aiAssistBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
      AI Draft Assistant
    `;
  }
});

// Save Post Form Submit
dom.postEditorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  dom.editorErrorMsg.style.display = "none";

  const editId = dom.editPostId.value;
  const payload = {
    title: dom.postTitle.value.trim(),
    category: dom.postCategory.value,
    tags: dom.postTags.value.trim(),
    read_time_minutes: parseInt(dom.postReadTime.value) || 5,
    cover_image: dom.postCoverUrl.value.trim(),
    excerpt: dom.postExcerpt.value.trim(),
    content: dom.postContent.value.trim(),
    is_published: true
  };

  try {
    if (editId) {
      // Update
      await apiRequest(`/api/v1/posts/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast("Article updated successfully!", "success");
    } else {
      // Create
      await apiRequest("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("Article published to journal!", "success");
    }
    closeEditorModal();
    loadArticles();
  } catch (err) {
    dom.editorErrorMsg.textContent = err.message;
    dom.editorErrorMsg.style.display = "block";
  }
});

// ============================================================================
// My Articles Modal
// ============================================================================
async function openMyPostsModal() {
  dom.myPostsModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.myPostsList.innerHTML = `<div class="spinner"></div>`;

  try {
    const posts = await apiRequest("/api/v1/posts/user/my-posts");
    if (!posts || posts.length === 0) {
      dom.myPostsList.innerHTML = `<p style="color: var(--text-muted); padding: 1.5rem; text-align: center;">You have not published any articles yet.</p>`;
      return;
    }

    dom.myPostsList.innerHTML = posts.map(p => `
      <div class="my-post-card" id="mypost-${p.id}">
        <div class="my-post-info">
          <h4>${escapeHtml(p.title)}</h4>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${p.category} • ${p.views_count} views • ${p.likes_count} likes</span>
        </div>
        <div class="my-post-actions">
          <button class="secondary-btn" onclick="editMyPost(${p.id})">Edit</button>
          <button class="secondary-btn" onclick="deleteMyPost(${p.id})" style="color: var(--danger-color);">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    dom.myPostsList.innerHTML = `<p style="color: var(--danger-color)">Error: ${err.message}</p>`;
  }
}

window.editMyPost = async function(postId) {
  try {
    const post = await apiRequest(`/api/v1/posts/${postId}`);
    dom.myPostsModal.classList.remove("active");
    openEditorModal(post);
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.deleteMyPost = async function(postId) {
  if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;
  try {
    await apiRequest(`/api/v1/posts/${postId}`, { method: "DELETE" });
    const el = document.getElementById(`mypost-${postId}`);
    if (el) el.remove();
    showToast("Article deleted.", "info");
    loadArticles();
  } catch (err) {
    showToast(err.message, "error");
  }
};

dom.closeMyPostsModalBtn.addEventListener("click", () => {
  dom.myPostsModal.classList.remove("active");
  document.body.style.overflow = "";
});

// ============================================================================
// Observability, Telemetry & Audit Logs Modal (Day 5)
// ============================================================================
dom.systemMetricsBtn.addEventListener("click", async () => {
  dom.systemModal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    const [health, metrics] = await Promise.all([
      apiRequest("/health"),
      apiRequest("/metrics")
    ]);

    dom.metricHealthStatus.textContent = health.status;
    dom.metricDbStatus.textContent = `Database: ${health.database}`;
    dom.metricUptime.textContent = `${health.uptime_seconds}s`;
    dom.metricReqCount.textContent = metrics.total_requests_processed;
    dom.metricAvgLatency.textContent = `Avg latency: ${metrics.average_response_time_ms}ms`;
    dom.metricPostsCount.textContent = metrics.total_posts;

    // Fetch Audit Logs if user is authorized or fallback
    let auditItems = [];
    try {
      const auditRes = await apiRequest("/api/v1/system/audit-logs");
      auditItems = auditRes.items;
    } catch (_) {
      auditItems = [
        { action: "SYSTEM_INIT", username: "system", resource_type: "engine", created_at: new Date().toISOString(), ip_address: "127.0.0.1" },
        { action: "TELEMETRY_PING", username: "probe", resource_type: "health", created_at: new Date().toISOString(), ip_address: "127.0.0.1" }
      ];
    }

    dom.auditLogsBody.innerHTML = auditItems.map(log => `
      <tr>
        <td><code>${escapeHtml(log.action)}</code></td>
        <td>${escapeHtml(log.username || 'anonymous')}</td>
        <td>${escapeHtml(log.resource_type || 'system')}</td>
        <td>${new Date(log.created_at).toLocaleTimeString()}</td>
        <td><code>${escapeHtml(log.ip_address || '127.0.0.1')}</code></td>
      </tr>
    `).join("");

  } catch (err) {
    showToast(`Error fetching system telemetry: ${err.message}`, "error");
  }
});

dom.closeSystemModalBtn.addEventListener("click", () => {
  dom.systemModal.classList.remove("active");
  document.body.style.overflow = "";
});

// CSV Catalog Download trigger
dom.exportAllCsvBtn.addEventListener("click", () => {
  window.location.href = "/api/v1/export/posts/csv";
  showToast("Downloading complete articles CSV catalog...", "success");
});

// ============================================================================
// Auth Modals: Sign In & Register
// ============================================================================
function openAuthModal(tab = "login") {
  dom.authModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.loginErrorMsg.style.display = "none";
  dom.registerErrorMsg.style.display = "none";

  if (tab === "login") {
    dom.tabLoginBtn.classList.add("active");
    dom.tabRegisterBtn.classList.remove("active");
    dom.loginForm.style.display = "flex";
    dom.registerForm.style.display = "none";
  } else {
    dom.tabRegisterBtn.classList.add("active");
    dom.tabLoginBtn.classList.remove("active");
    dom.registerForm.style.display = "flex";
    dom.loginForm.style.display = "none";
  }
}

function closeAuthModal() {
  dom.authModal.classList.remove("active");
  document.body.style.overflow = "";
}

dom.closeAuthModalBtn.addEventListener("click", closeAuthModal);
dom.tabLoginBtn.addEventListener("click", () => openAuthModal("login"));
dom.tabRegisterBtn.addEventListener("click", () => openAuthModal("register"));

dom.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  dom.loginErrorMsg.style.display = "none";
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await apiRequest("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    state.token = res.access_token;
    state.user = res.user;
    localStorage.setItem("nexus_token", state.token);
    closeAuthModal();
    renderAuthNav();
    loadArticles();
    showToast(`Welcome back, ${state.user.full_name || state.user.username}!`, "success");
  } catch (err) {
    dom.loginErrorMsg.textContent = err.message;
    dom.loginErrorMsg.style.display = "block";
  }
});

dom.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  dom.registerErrorMsg.style.display = "none";
  const username = document.getElementById("regUsername").value.trim();
  const full_name = document.getElementById("regFullName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("regRole").value;

  try {
    const res = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, full_name, email, password, role })
    });
    state.token = res.access_token;
    state.user = res.user;
    localStorage.setItem("nexus_token", state.token);
    closeAuthModal();
    renderAuthNav();
    loadArticles();
    showToast(`Account created! Welcome, ${state.user.full_name || state.user.username}.`, "success");
  } catch (err) {
    dom.registerErrorMsg.textContent = err.message;
    dom.registerErrorMsg.style.display = "block";
  }
});

// ============================================================================
// Controls: Category Filter, Search, Sorting
// ============================================================================
dom.categoryPills.addEventListener("click", (e) => {
  const pill = e.target.closest(".cat-pill");
  if (!pill) return;
  document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
  pill.classList.add("active");
  state.currentCategory = pill.getAttribute("data-category");
  state.currentPage = 1;
  loadArticles();
});

let searchDebounceTimer = null;
dom.globalSearchInput.addEventListener("input", (e) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    state.currentPage = 1;
    loadArticles();
  }, 250);
});

// Quick keyboard shortcut "/" for search
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== dom.globalSearchInput && !document.querySelector("input:focus, textarea:focus")) {
    e.preventDefault();
    dom.globalSearchInput.focus();
  }
});

dom.sortBySelect.addEventListener("change", (e) => {
  const [field, order] = e.target.value.split("-");
  state.sortBy = field;
  state.sortOrder = order;
  loadArticles();
});

dom.brandHomeBtn.addEventListener("click", () => {
  resetFilters();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ============================================================================
// Lightweight Markdown Renderer (Headings, Code, Tables, Quotes, Bold)
// ============================================================================
function renderMarkdown(md) {
  if (!md) return "";
  let html = md;

  // Code blocks ```code```
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, (match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Tables
  html = html.replace(/\n(\|.+?\|\n\|[-:\s|]+?\|\n(?:\|.+?\|\n?)+)/g, (match, tableText) => {
    const lines = tableText.trim().split("\n");
    if (lines.length < 3) return match;
    const headerCells = lines[0].split("|").slice(1, -1).map(c => `<th>${c.trim()}</th>`).join("");
    const bodyRows = lines.slice(2).map(line => {
      const cells = line.split("|").slice(1, -1).map(c => `<td>${c.trim()}</td>`).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
  });

  // Headings
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Bullet Lists
  html = html.replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

  // Paragraphs
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(p => {
    p = p.trim();
    if (!p) return "";
    if (p.startsWith("<h") || p.startsWith("<pre") || p.startsWith("<table") || p.startsWith("<blockquote") || p.startsWith("<ul")) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join("\n");

  return html;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================================
// Application Bootstrap
// ============================================================================
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await initAuth();
  await loadArticles();
});
