/**
 * LATENT Platform — Client Application Engine
 * Medium-Grade Layout, Multi-View Subtabs, Bookmarks, and RBAC Architecture
 */

// Global State
const state = {
  token: localStorage.getItem("latent_token") || localStorage.getItem("nexus_token") || null,
  user: null,
  theme: localStorage.getItem("latent_theme") || "dark",
  currentView: "home", // home, library, profile, stories, stats
  currentHomeSubtab: "for-you",
  currentCategory: "",
  searchQuery: "",
  sortBy: "created_at",
  sortOrder: "desc",
  articles: [],
  allArticlesMap: new Map(),
  userLikedPostIds: new Set(JSON.parse(localStorage.getItem("latent_liked_ids") || "[]")),
  userSavedPostIds: new Set(JSON.parse(localStorage.getItem("latent_saved_ids") || "[]")),
  userReadingHistory: JSON.parse(localStorage.getItem("latent_history_ids") || "[]"),
  currentReadingPost: null
};

// DOM Elements
const dom = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  authNavContainer: document.getElementById("authNavContainer"),
  brandLogoHome: document.getElementById("brandLogoHome"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  topWriteBtn: document.getElementById("topWriteBtn"),
  rightWriteCtaBtn: document.getElementById("rightWriteCtaBtn"),
  exportAllCsvBtn: document.getElementById("exportAllCsvBtn"),
  mobileSidebarToggle: document.getElementById("mobileSidebarToggle"),
  mediumSidebar: document.getElementById("mediumSidebar"),

  // Views
  views: {
    home: document.getElementById("viewHome"),
    library: document.getElementById("viewLibrary"),
    profile: document.getElementById("viewProfile"),
    stories: document.getElementById("viewStories"),
    stats: document.getElementById("viewStats")
  },

  // Sidebar Buttons
  sidebarBtns: {
    home: document.getElementById("sidebarHomeBtn"),
    library: document.getElementById("sidebarLibraryBtn"),
    profile: document.getElementById("sidebarProfileBtn"),
    stories: document.getElementById("sidebarStoriesBtn"),
    stats: document.getElementById("sidebarStatsBtn")
  },

  // Home View Elements
  articlesGrid: document.getElementById("articlesGrid"),
  resultsCount: document.getElementById("resultsCount"),
  sortBySelect: document.getElementById("sortBySelect"),
  refreshFeedBtn: document.getElementById("refreshFeedBtn"),
  staffPicksList: document.getElementById("staffPicksList"),

  // Library View Elements
  libraryContent: document.getElementById("libraryContent"),

  // Profile View Elements
  profileCardHeader: document.getElementById("profileCardHeader"),
  profileTabContent: document.getElementById("profileTabContent"),

  // Stories View Elements
  storiesListContainer: document.getElementById("storiesListContainer"),
  writeStoryBtn: document.getElementById("writeStoryBtn"),

  // Stats View Elements
  statsPresentations: document.getElementById("statsPresentations"),
  statsViews: document.getElementById("statsViews"),
  statsReads: document.getElementById("statsReads"),
  statsLikes: document.getElementById("statsLikes"),
  statsLatency: document.getElementById("statsLatency"),
  statsAuditTableBody: document.getElementById("statsAuditTableBody"),

  // Modals
  readerModal: document.getElementById("readerModal"),
  closeReaderBtn: document.getElementById("closeReaderBtn"),
  readerArticleContent: document.getElementById("readerArticleContent"),
  readerBookmarkBtn: document.getElementById("readerBookmarkBtn"),
  readerBookmarkText: document.getElementById("readerBookmarkText"),
  readerMarkdownExportBtn: document.getElementById("readerMarkdownExportBtn"),
  readerLikeBtn: document.getElementById("readerLikeBtn"),
  readerLikeCount: document.getElementById("readerLikeCount"),
  commentComposerContainer: document.getElementById("commentComposerContainer"),
  readerCommentsList: document.getElementById("readerCommentsList"),
  readerCommentsCount: document.getElementById("readerCommentsCount"),

  authModal: document.getElementById("authModal"),
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn"),
  tabLoginBtn: document.getElementById("tabLoginBtn"),
  tabRegisterBtn: document.getElementById("tabRegisterBtn"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginErrorMsg: document.getElementById("loginErrorMsg"),
  registerErrorMsg: document.getElementById("registerErrorMsg"),

  editorModal: document.getElementById("editorModal"),
  closeEditorModalBtn: document.getElementById("closeEditorModalBtn"),
  cancelEditorBtn: document.getElementById("cancelEditorBtn"),
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
  editorErrorMsg: document.getElementById("editorErrorMsg"),

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
  }, 3200);
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
  if (response.status === 204) return null;

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
    localStorage.setItem("latent_theme", state.theme);
  });
}

// ============================================================================
// View Navigation (Home, Library, Profile, Stories, Stats)
// ============================================================================
function switchView(targetView) {
  state.currentView = targetView;

  // Toggle active view
  Object.keys(dom.views).forEach(vKey => {
    if (vKey === targetView) {
      dom.views[vKey].style.display = "flex";
      dom.views[vKey].classList.add("active");
    } else {
      dom.views[vKey].style.display = "none";
      dom.views[vKey].classList.remove("active");
    }
  });

  // Toggle active sidebar button
  Object.keys(dom.sidebarBtns).forEach(bKey => {
    if (bKey === targetView) {
      dom.sidebarBtns[bKey].classList.add("active");
    } else {
      dom.sidebarBtns[bKey].classList.remove("active");
    }
  });

  // Load view-specific content
  if (targetView === "home") {
    loadArticles();
  } else if (targetView === "library") {
    renderLibraryView("saved");
  } else if (targetView === "profile") {
    renderProfileView();
  } else if (targetView === "stories") {
    renderStoriesView();
  } else if (targetView === "stats") {
    renderStatsView();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Attach sidebar listeners
Object.keys(dom.sidebarBtns).forEach(viewKey => {
  dom.sidebarBtns[viewKey].addEventListener("click", () => {
    switchView(viewKey);
    // On mobile, close sidebar after clicking
    dom.mediumSidebar.classList.remove("open");
  });
});

// Mobile toggle
if (dom.mobileSidebarToggle) {
  dom.mobileSidebarToggle.addEventListener("click", () => {
    dom.mediumSidebar.classList.toggle("open");
  });
}

// ============================================================================
// Authentication & Top Navigation
// ============================================================================
async function initAuth() {
  if (state.token) {
    try {
      state.user = await apiRequest("/api/v1/auth/me");
    } catch (err) {
      logout();
    }
  }
  renderAuthNav();
}

function renderAuthNav() {
  if (state.user) {
    dom.authNavContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <img src="${state.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + state.user.username}" 
             class="user-avatar-chip" 
             id="topUserAvatar"
             title="${escapeHtml(state.user.full_name || state.user.username)} (${state.user.role})">
      </div>
    `;

    document.getElementById("topUserAvatar").addEventListener("click", () => {
      switchView("profile");
    });

  } else {
    dom.authNavContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
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
  localStorage.removeItem("latent_token");
  localStorage.removeItem("nexus_token");
  renderAuthNav();
  switchView("home");
  showToast("Signed out successfully.", "info");
}

// ============================================================================
// Articles Feed Loading & Rendering
// ============================================================================
async function loadArticles() {
  dom.articlesGrid.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Loading curated engineering papers...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams({
      page: 1,
      limit: 20,
      sort_by: state.sortBy,
      sort_order: state.sortOrder
    });

    if (state.currentCategory) params.append("category", state.currentCategory);
    if (state.searchQuery) params.append("search", state.searchQuery);

    const data = await apiRequest(`/api/v1/posts?${params.toString()}`);
    state.articles = data.items;
    data.items.forEach(p => state.allArticlesMap.set(p.id, p));

    renderFeedList(state.articles);
    renderStaffPicks(state.articles.slice(0, 3));
    dom.resultsCount.textContent = `Showing ${data.total} articles`;

  } catch (err) {
    dom.articlesGrid.innerHTML = `
      <div class="loading-state">
        <p style="color: var(--danger-color)">Error loading articles: ${err.message}</p>
        <button class="secondary-btn" onclick="loadArticles()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

function renderFeedList(posts) {
  if (!posts || posts.length === 0) {
    dom.articlesGrid.innerHTML = `
      <div class="loading-state">
        <p>No engineering stories found matching criteria.</p>
        <button class="secondary-btn" onclick="resetFilters()" style="margin-top: 1rem;">Clear Filters</button>
      </div>
    `;
    return;
  }

  dom.articlesGrid.innerHTML = posts.map(post => {
    const pubDate = new Date(post.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const isLiked = state.userLikedPostIds.has(post.id);
    const isSaved = state.userSavedPostIds.has(post.id);

    return `
      <article class="medium-article-item" data-post-id="${post.id}">
        <!-- Left Main Text Column -->
        <div class="article-main-col">
          <!-- Author Header -->
          <div class="article-author-meta">
            <img src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.author.username}" class="author-mini-avatar" alt="Avatar">
            <span class="author-meta-name">${escapeHtml(post.author.full_name || post.author.username)}</span>
            <span class="meta-divider">·</span>
            <span class="author-meta-date">${pubDate}</span>
          </div>

          <!-- Headline & Deck -->
          <h2 class="article-headline">${escapeHtml(post.title)}</h2>
          <p class="article-deck">${escapeHtml(post.excerpt)}</p>

          <!-- Engagement Footer Row (Claps, Comments, Bookmark, Tags) -->
          <div class="article-action-footer">
            <div class="footer-left-metrics">
              <span class="cat-badge-small">${escapeHtml(post.category)}</span>
              <span class="read-time-pill">${post.read_time_minutes} min read</span>

              <!-- Like / Clap Button -->
              <button class="clap-btn ${isLiked ? 'clapped' : ''}" data-clap-id="${post.id}" title="Clap / Like this article">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span class="clap-count">${post.likes_count}</span>
              </button>

              <!-- Comments Count -->
              <div class="comment-counter-btn" title="Responses">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                <span>${post.comments_count}</span>
              </div>
            </div>

            <!-- Right Bookmark & Share -->
            <div class="footer-right-actions">
              <button class="bookmark-icon-btn ${isSaved ? 'bookmarked' : ''}" data-bookmark-id="${post.id}" title="Save story to library">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Thumbnail Column (Medium Hallmark Layout) -->
        <div class="article-thumb-col">
          <img src="${post.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'}" 
               alt="${escapeHtml(post.title)}" 
               class="article-thumb-img"
               loading="lazy">
        </div>
      </article>
    `;
  }).join("");

  // Attach card click handlers
  document.querySelectorAll(".medium-article-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if (e.target.closest(".clap-btn") || e.target.closest(".bookmark-icon-btn")) return;
      const postId = item.getAttribute("data-post-id");
      openReaderModal(postId);
    });
  });

  // Attach clap handlers
  document.querySelectorAll(".clap-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const postId = btn.getAttribute("data-clap-id");
      handleLikeToggle(postId, btn);
    });
  });

  // Attach bookmark handlers
  document.querySelectorAll(".bookmark-icon-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const postId = parseInt(btn.getAttribute("data-bookmark-id"));
      toggleBookmark(postId, btn);
    });
  });
}

function renderStaffPicks(picks) {
  if (!dom.staffPicksList) return;
  dom.staffPicksList.innerHTML = picks.map(post => `
    <div class="staff-pick-item" onclick="openReaderModal(${post.id})">
      <div class="staff-pick-author">
        <img src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.author.username}" alt="Avatar">
        <span>${escapeHtml(post.author.full_name || post.author.username)}</span>
      </div>
      <h5 class="staff-pick-title">${escapeHtml(post.title)}</h5>
    </div>
  `).join("");
}

function toggleBookmark(postId, btnElement) {
  const isSaved = state.userSavedPostIds.has(postId);
  if (isSaved) {
    state.userSavedPostIds.delete(postId);
    if (btnElement) btnElement.classList.remove("bookmarked");
    showToast("Story removed from your library.", "info");
  } else {
    state.userSavedPostIds.add(postId);
    if (btnElement) btnElement.classList.add("bookmarked");
    showToast("Story saved to your library.", "success");
  }
  localStorage.setItem("latent_saved_ids", JSON.stringify([...state.userSavedPostIds]));
  if (state.currentReadingPost && state.currentReadingPost.id === postId) {
    updateReaderBookmarkState();
  }
}

function updateReaderBookmarkState() {
  if (!state.currentReadingPost) return;
  const isSaved = state.userSavedPostIds.has(state.currentReadingPost.id);
  if (isSaved) {
    dom.readerBookmarkBtn.classList.add("bookmarked");
    dom.readerBookmarkText.textContent = "Saved";
  } else {
    dom.readerBookmarkBtn.classList.remove("bookmarked");
    dom.readerBookmarkText.textContent = "Save";
  }
}

// ============================================================================
// Engagement: Like / Clap Toggle with Optimistic UI
// ============================================================================
async function handleLikeToggle(postId, btnElement) {
  if (!state.user) {
    showToast("Please sign in to clap for this story.", "info");
    openAuthModal("login");
    return;
  }

  const countSpan = btnElement ? btnElement.querySelector(".clap-count") : dom.readerLikeCount;
  const currentCount = parseInt(countSpan.textContent || "0");
  const wasLiked = state.userLikedPostIds.has(parseInt(postId));

  // Optimistic update
  if (wasLiked) {
    if (btnElement) btnElement.classList.remove("clapped");
    if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
    state.userLikedPostIds.delete(parseInt(postId));
  } else {
    if (btnElement) btnElement.classList.add("clapped");
    if (countSpan) countSpan.textContent = currentCount + 1;
    state.userLikedPostIds.add(parseInt(postId));
  }
  localStorage.setItem("latent_liked_ids", JSON.stringify([...state.userLikedPostIds]));

  try {
    const res = await apiRequest(`/api/v1/posts/${postId}/likes/toggle`, { method: "POST" });
    if (countSpan) countSpan.textContent = res.likes_count;
    if (res.liked) {
      if (btnElement) btnElement.classList.add("clapped");
      state.userLikedPostIds.add(parseInt(postId));
    } else {
      if (btnElement) btnElement.classList.remove("clapped");
      state.userLikedPostIds.delete(parseInt(postId));
    }
    localStorage.setItem("latent_liked_ids", JSON.stringify([...state.userLikedPostIds]));
  } catch (err) {
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
      <p>Loading full story...</p>
    </div>
  `;

  try {
    const post = await apiRequest(`/api/v1/posts/${postIdOrSlug}`);
    state.currentReadingPost = post;
    state.allArticlesMap.set(post.id, post);

    // Track Reading History
    if (!state.userReadingHistory.includes(post.id)) {
      state.userReadingHistory.unshift(post.id);
      localStorage.setItem("latent_history_ids", JSON.stringify(state.userReadingHistory.slice(0, 50)));
    }

    const pubDate = new Date(post.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    });

    const isLiked = state.userLikedPostIds.has(post.id);
    dom.readerLikeCount.textContent = post.likes_count;
    if (isLiked) dom.readerLikeBtn.classList.add("liked");
    else dom.readerLikeBtn.classList.remove("liked");

    updateReaderBookmarkState();

    dom.readerArticleContent.innerHTML = `
      <div class="reader-header-area">
        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem;">
          <span class="cat-badge-small">${escapeHtml(post.category)}</span>
          <span class="read-time-pill">${post.read_time_minutes} min read</span>
          <span class="read-time-pill" style="margin-left: auto;">${post.views_count} views</span>
        </div>

        <h1 class="reader-title">${escapeHtml(post.title)}</h1>

        <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 2rem;">
          <img src="${post.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + post.author.username}" 
               style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" 
               alt="Author">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem;">${escapeHtml(post.author.full_name || post.author.username)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(post.author.role)} · Published ${pubDate}</div>
          </div>
        </div>

        ${post.cover_image ? `
          <img src="${post.cover_image}" alt="${escapeHtml(post.title)}" class="reader-cover-image">
        ` : ''}

        <p style="font-size: 1.15rem; font-style: italic; color: var(--text-secondary); margin-bottom: 2rem; border-left: 3px solid var(--accent-primary); padding-left: 1rem;">
          ${escapeHtml(post.excerpt)}
        </p>
      </div>

      <div class="reader-prose">
        ${renderMarkdown(post.content)}
      </div>
    `;

    renderCommentsSection(post);

  } catch (err) {
    dom.readerArticleContent.innerHTML = `<p style="color: var(--danger-color)">Error: ${err.message}</p>`;
  }
}

function closeReaderModal() {
  dom.readerModal.classList.remove("active");
  document.body.style.overflow = "";
  state.currentReadingPost = null;
  loadArticles();
}

dom.closeReaderBtn.addEventListener("click", closeReaderModal);
dom.readerBookmarkBtn.addEventListener("click", () => {
  if (state.currentReadingPost) {
    toggleBookmark(state.currentReadingPost.id, null);
    updateReaderBookmarkState();
  }
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
// Discussions & Comments System
// ============================================================================
function renderCommentsSection(post) {
  dom.readerCommentsCount.textContent = post.comments ? post.comments.length : 0;

  if (state.user) {
    dom.commentComposerContainer.innerHTML = `
      <form id="addCommentForm" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 2rem;">
        <textarea id="commentTextInput" class="form-group textarea" rows="3" placeholder="What are your thoughts?" required minlength="2" style="width: 100%; padding: 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-medium); background: var(--bg-elevated); color: var(--text-primary);"></textarea>
        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="primary-btn">Respond</button>
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
        showToast("Response published!", "success");
        post.comments = [newComment, ...(post.comments || [])];
        renderCommentsList(post.comments, post.author_id);
        dom.readerCommentsCount.textContent = post.comments.length;
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } else {
    dom.commentComposerContainer.innerHTML = `
      <div style="padding: 1.5rem; text-align: center; background: var(--bg-elevated); border-radius: var(--radius-sm); margin-bottom: 2rem;">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">Sign in to join the discussion and respond.</p>
        <button class="primary-btn" onclick="openAuthModal('login')">Sign In to Respond</button>
      </div>
    `;
  }

  renderCommentsList(post.comments || [], post.author_id);
}

function renderCommentsList(comments, postAuthorId) {
  if (!comments || comments.length === 0) {
    dom.readerCommentsList.innerHTML = `<p style="color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1.5rem;">No responses yet. Be the first to share your thoughts!</p>`;
    return;
  }

  dom.readerCommentsList.innerHTML = comments.map(c => {
    const timeStr = new Date(c.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
    const canDelete = state.user && (state.user.id === c.author_id || state.user.id === postAuthorId || state.user.role === "ADMIN");

    return `
      <div style="padding: 1rem 0; border-bottom: 1px solid var(--border-subtle);" id="comment-${c.id}">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <img src="${c.author.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + c.author.username}" style="width: 28px; height: 28px; border-radius: 50%;">
            <span style="font-size: 0.85rem; font-weight: 600;">${escapeHtml(c.author.full_name || c.author.username)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">· ${timeStr}</span>
          </div>
          ${canDelete ? `<button onclick="deleteComment(${c.id})" style="color: var(--danger-color); font-size: 0.78rem;">Delete</button>` : ''}
        </div>
        <p style="font-size: 0.94rem; color: var(--text-primary);">${escapeHtml(c.content)}</p>
      </div>
    `;
  }).join("");
}

window.deleteComment = async function(commentId) {
  if (!confirm("Delete this response?")) return;
  try {
    await apiRequest(`/api/v1/comments/${commentId}`, { method: "DELETE" });
    const el = document.getElementById(`comment-${commentId}`);
    if (el) el.remove();
    showToast("Response deleted.", "info");
    const count = parseInt(dom.readerCommentsCount.textContent || "1");
    dom.readerCommentsCount.textContent = Math.max(0, count - 1);
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ============================================================================
// View 2: Library (Saved Lists, Liked Posts, Reading History)
// ============================================================================
function renderLibraryView(subtab = "saved") {
  // Update subtab buttons
  document.querySelectorAll("#viewLibrary .feed-tab").forEach(tab => {
    if (tab.getAttribute("data-libtab") === subtab) tab.classList.add("active");
    else tab.classList.remove("active");
  });

  let targetIds = [];
  if (subtab === "saved") {
    targetIds = [...state.userSavedPostIds];
  } else if (subtab === "liked") {
    targetIds = [...state.userLikedPostIds];
  } else if (subtab === "history") {
    targetIds = state.userReadingHistory;
  }

  const posts = targetIds.map(id => state.allArticlesMap.get(id)).filter(Boolean);

  if (posts.length === 0) {
    dom.libraryContent.innerHTML = `
      <div class="library-empty-box">
        <h3>No stories in ${subtab === 'saved' ? 'Saved lists' : subtab === 'liked' ? 'Liked posts' : 'Reading history'}</h3>
        <p>Explore articles in the feed and click the bookmark or like button to save them here.</p>
        <button class="primary-btn" onclick="switchView('home')">Explore stories</button>
      </div>
    `;
    return;
  }

  dom.libraryContent.innerHTML = `
    <div class="articles-feed-container">
      ${posts.map(p => `
        <article class="medium-article-item" onclick="openReaderModal(${p.id})">
          <div class="article-main-col">
            <div class="article-author-meta">
              <span class="author-meta-name">${escapeHtml(p.author.full_name || p.author.username)}</span>
              <span class="meta-divider">·</span>
              <span class="author-meta-date">${p.category}</span>
            </div>
            <h2 class="article-headline">${escapeHtml(p.title)}</h2>
            <p class="article-deck">${escapeHtml(p.excerpt)}</p>
          </div>
          <div class="article-thumb-col">
            <img src="${p.cover_image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80'}" class="article-thumb-img">
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

// Subtab switcher in Library
document.querySelectorAll("#viewLibrary .feed-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const subtab = tab.getAttribute("data-libtab");
    renderLibraryView(subtab);
  });
});

// ============================================================================
// View 3: Profile View
// ============================================================================
async function renderProfileView() {
  const user = state.user || {
    full_name: "Guest Engineer",
    username: "guest",
    bio: "AI Systems Researcher exploring the frontiers of production engineering.",
    role: "READER",
    avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=guest"
  };

  dom.profileCardHeader.innerHTML = `
    <img src="${user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username}" class="profile-avatar-large">
    <div class="profile-info-block">
      <h2>${escapeHtml(user.full_name || user.username)}</h2>
      <p style="margin-bottom: 0.35rem;">@${escapeHtml(user.username)} · <span class="cat-badge-small">${user.role}</span></p>
      <p>${escapeHtml(user.bio || 'AI & Data Engineering Architect')}</p>
    </div>
  `;

  if (state.user) {
    try {
      const myPosts = await apiRequest("/api/v1/posts/user/my-posts");
      dom.profileTabContent.innerHTML = `
        <div class="articles-feed-container" style="margin-top: 1.5rem;">
          ${myPosts.length > 0 ? myPosts.map(p => `
            <article class="medium-article-item" onclick="openReaderModal(${p.id})">
              <div class="article-main-col">
                <h2 class="article-headline">${escapeHtml(p.title)}</h2>
                <p class="article-deck">${escapeHtml(p.excerpt)}</p>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.5rem;">
                  ${p.views_count} views · ${p.likes_count} claps
                </div>
              </div>
              <div class="article-thumb-col">
                <img src="${p.cover_image}" class="article-thumb-img">
              </div>
            </article>
          `).join("") : `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No published stories yet.</p>`}
        </div>
      `;
    } catch (_) {}
  } else {
    dom.profileTabContent.innerHTML = `
      <div class="library-empty-box">
        <h3>Sign in to manage your profile</h3>
        <p>Authors can publish deep-dive technical research and manage reading lists.</p>
        <button class="primary-btn" onclick="openAuthModal('login')">Sign In</button>
      </div>
    `;
  }
}

// ============================================================================
// View 4: Stories View (Drafts & Published)
// ============================================================================
async function renderStoriesView() {
  if (!state.user) {
    dom.storiesListContainer.innerHTML = `
      <div class="library-empty-box">
        <h3>Sign in to view your stories</h3>
        <p>Publish and manage your production engineering articles.</p>
        <button class="primary-btn" onclick="openAuthModal('login')">Sign In</button>
      </div>
    `;
    return;
  }

  try {
    const posts = await apiRequest("/api/v1/posts/user/my-posts");
    if (posts.length === 0) {
      dom.storiesListContainer.innerHTML = `
        <div class="library-empty-box">
          <h3>You have no published stories</h3>
          <p>Share your architecture insights with the AI engineering community.</p>
          <button class="primary-btn" onclick="openEditorModal()">Write a story</button>
        </div>
      `;
      return;
    }

    dom.storiesListContainer.innerHTML = posts.map(p => `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 0; border-bottom: 1px solid var(--border-subtle);">
        <div>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.25rem; cursor: pointer;" onclick="openReaderModal(${p.id})">${escapeHtml(p.title)}</h4>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${p.category} · ${p.views_count} views · ${p.likes_count} claps</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="secondary-btn" onclick="editMyPost(${p.id})">Edit</button>
          <button class="secondary-btn" onclick="deleteMyPost(${p.id})" style="color: var(--danger-color);">Delete</button>
        </div>
      </div>
    `).join("");

  } catch (err) {
    dom.storiesListContainer.innerHTML = `<p style="color: var(--danger-color)">Error: ${err.message}</p>`;
  }
}

window.editMyPost = async function(postId) {
  try {
    const post = await apiRequest(`/api/v1/posts/${postId}`);
    openEditorModal(post);
  } catch (err) {
    showToast(err.message, "error");
  }
};

window.deleteMyPost = async function(postId) {
  if (!confirm("Are you sure you want to delete this story?")) return;
  try {
    await apiRequest(`/api/v1/posts/${postId}`, { method: "DELETE" });
    showToast("Story deleted.", "info");
    renderStoriesView();
  } catch (err) {
    showToast(err.message, "error");
  }
};

// ============================================================================
// View 5: Stats View (Monthly Analytics & Audit Trail)
// ============================================================================
async function renderStatsView() {
  try {
    const [health, metrics] = await Promise.all([
      apiRequest("/health"),
      apiRequest("/metrics")
    ]);

    dom.statsPresentations.textContent = "1,420";
    dom.statsViews.textContent = metrics.total_requests_processed || "842";
    dom.statsReads.textContent = Math.round((metrics.total_requests_processed || 842) * 0.62);
    dom.statsLikes.textContent = metrics.total_likes;
    dom.statsLatency.textContent = `${metrics.average_response_time_ms}ms`;

    // Audit logs
    let auditItems = [];
    try {
      const auditRes = await apiRequest("/api/v1/system/audit-logs");
      auditItems = auditRes.items;
    } catch (_) {
      auditItems = [
        { action: "SYSTEM_INIT", username: "system", resource_type: "engine", created_at: new Date().toISOString(), ip_address: "127.0.0.1" },
        { action: "TELEMETRY_PROBE", username: "healthcheck", resource_type: "probe", created_at: new Date().toISOString(), ip_address: "127.0.0.1" }
      ];
    }

    dom.statsAuditTableBody.innerHTML = auditItems.map(log => `
      <tr>
        <td><code>${escapeHtml(log.action)}</code></td>
        <td>${escapeHtml(log.username || 'anonymous')}</td>
        <td>${escapeHtml(log.resource_type || 'post')}</td>
        <td>${new Date(log.created_at).toLocaleTimeString()}</td>
        <td><code>${escapeHtml(log.ip_address || '127.0.0.1')}</code></td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

// Subtab switcher in Stats
document.querySelectorAll("#viewStats .feed-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#viewStats .feed-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const subtab = tab.getAttribute("data-stattab");
    if (subtab === "system") {
      document.getElementById("statsAuditSection").style.display = "block";
    } else {
      document.getElementById("statsAuditSection").style.display = "block";
    }
  });
});

// ============================================================================
// Author Studio: Write & Edit Stories
// ============================================================================
function openEditorModal(post = null) {
  if (!state.user) {
    showToast("Please sign in to write a story.", "info");
    openAuthModal("login");
    return;
  }

  dom.editorModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.editorErrorMsg.style.display = "none";

  if (post) {
    dom.editorModalTitle.textContent = "Edit story";
    dom.editPostId.value = post.id;
    dom.postTitle.value = post.title;
    dom.postCategory.value = post.category;
    dom.postTags.value = post.tags || "";
    dom.postReadTime.value = post.read_time_minutes;
    dom.postCoverUrl.value = post.cover_image || "";
    dom.postExcerpt.value = post.excerpt;
    dom.postContent.value = post.content;
  } else {
    dom.editorModalTitle.textContent = "Write a story";
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

dom.topWriteBtn.addEventListener("click", () => openEditorModal());
if (dom.rightWriteCtaBtn) dom.rightWriteCtaBtn.addEventListener("click", () => openEditorModal());
if (dom.writeStoryBtn) dom.writeStoryBtn.addEventListener("click", () => openEditorModal());

dom.closeEditorModalBtn.addEventListener("click", closeEditorModal);
dom.cancelEditorBtn.addEventListener("click", closeEditorModal);

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

// Multipart Cover Image Upload
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

// AI Draft Assistant
dom.aiAssistBtn.addEventListener("click", async () => {
  const title = dom.postTitle.value.trim();
  const content = dom.postContent.value.trim();

  if (!title || content.length < 20) {
    showToast("Please provide a title and at least 20 characters of content first.", "info");
    return;
  }

  dom.aiAssistBtn.textContent = "Analyzing Draft...";
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
    dom.aiAssistBtn.textContent = "AI Draft Assistant";
  }
});

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
      await apiRequest(`/api/v1/posts/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showToast("Story updated!", "success");
    } else {
      await apiRequest("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("Story published to Latent!", "success");
    }
    closeEditorModal();
    loadArticles();
  } catch (err) {
    dom.editorErrorMsg.textContent = err.message;
    dom.editorErrorMsg.style.display = "block";
  }
});

// ============================================================================
// Auth Modals
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
    localStorage.setItem("latent_token", state.token);
    closeAuthModal();
    renderAuthNav();
    showToast(`Welcome back, ${state.user.full_name || state.user.username}!`, "success");
    loadArticles();
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
    localStorage.setItem("latent_token", state.token);
    closeAuthModal();
    renderAuthNav();
    showToast(`Welcome to Latent, ${state.user.full_name || state.user.username}!`, "success");
    loadArticles();
  } catch (err) {
    dom.registerErrorMsg.textContent = err.message;
    dom.registerErrorMsg.style.display = "block";
  }
});

// ============================================================================
// Controls: Subtabs, Categories, Search
// ============================================================================
// Home Subtabs (For You, Following, Activity)
document.querySelectorAll(".feed-tabs-list .feed-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".feed-tabs-list .feed-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const subtab = btn.getAttribute("data-subtab");
    state.currentHomeSubtab = subtab;

    if (subtab === "following") {
      // Filter by authors followed
      const filtered = state.articles.filter(p => p.author.username === "dr_elena" || p.author.username === "marcus_chen");
      renderFeedList(filtered);
    } else if (subtab === "activity") {
      // Activity stream
      renderActivityStream();
    } else {
      renderFeedList(state.articles);
    }
  });
});

function renderActivityStream() {
  dom.articlesGrid.innerHTML = `
    <div style="padding: 1.5rem 0;">
      <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem;">Live Community Activity</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem;">
          <span style="color: #F43F5E; font-size: 1.2rem;">♥</span>
          <div><strong>Dr. Elena Vance</strong> clapped for <em>Ultra-Low Latency LLM Serving</em></div>
          <span style="margin-left: auto; font-size: 0.78rem; color: var(--text-muted);">12m ago</span>
        </div>
        <div style="padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem;">
          <span style="color: var(--accent-primary); font-size: 1.2rem;">💬</span>
          <div><strong>Marcus Chen</strong> responded to <em>Architecting Production RAG</em></div>
          <span style="margin-left: auto; font-size: 0.78rem; color: var(--text-muted);">34m ago</span>
        </div>
        <div style="padding: 1rem; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem;">
          <span style="color: #10B981; font-size: 1.2rem;">★</span>
          <div><strong>Sarah Jenkins</strong> published <em>The Modern Lakehouse Architecture</em></div>
          <span style="margin-left: auto; font-size: 0.78rem; color: var(--text-muted);">2h ago</span>
        </div>
      </div>
    </div>
  `;
}

// Category Pills
document.querySelectorAll(".cat-chip").forEach(chip => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
    chip.classList.add("active");
    state.currentCategory = chip.getAttribute("data-category");
    loadArticles();
  });
});

// Recommended Topics in right sidebar
document.querySelectorAll(".topic-pill").forEach(pill => {
  pill.addEventListener("click", () => {
    const topic = pill.getAttribute("data-topic");
    state.currentCategory = topic;
    switchView("home");
    document.querySelectorAll(".cat-chip").forEach(c => {
      if (c.getAttribute("data-category") === topic) c.classList.add("active");
      else c.classList.remove("active");
    });
    loadArticles();
  });
});

// Follow buttons
document.querySelectorAll(".follow-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const isFollowing = btn.classList.contains("following");
    if (isFollowing) {
      btn.classList.remove("following");
      btn.textContent = "Follow";
    } else {
      btn.classList.add("following");
      btn.textContent = "Following";
      showToast("Author added to your following feed!", "success");
    }
  });
});

// Search input
let searchTimer = null;
dom.globalSearchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchQuery = e.target.value.trim();
    switchView("home");
    loadArticles();
  }, 250);
});

// Sort select
dom.sortBySelect.addEventListener("change", (e) => {
  const [field, order] = e.target.value.split("-");
  state.sortBy = field;
  state.sortOrder = order;
  loadArticles();
});

if (dom.refreshFeedBtn) {
  dom.refreshFeedBtn.addEventListener("click", loadArticles);
}

dom.brandLogoHome.addEventListener("click", () => {
  resetFilters();
  switchView("home");
});

function resetFilters() {
  state.currentCategory = "";
  state.searchQuery = "";
  dom.globalSearchInput.value = "";
  document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
  document.querySelector(".cat-chip[data-category='']").classList.add("active");
  loadArticles();
}

dom.exportAllCsvBtn.addEventListener("click", () => {
  window.location.href = "/api/v1/export/posts/csv";
  showToast("Downloading catalog CSV...", "success");
});

// Markdown Renderer
function renderMarkdown(md) {
  if (!md) return "";
  let html = md;
  html = html.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
  });
  html = html.replace(/`([^`]+)`/g, (match, code) => `<code>${escapeHtml(code)}</code>`);
  html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
  html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
  html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");
  html = html.replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>");
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>");

  const paragraphs = html.split(/\n\s*\n/);
  return paragraphs.map(p => {
    p = p.trim();
    if (!p) return "";
    if (p.startsWith("<h") || p.startsWith("<pre") || p.startsWith("<table") || p.startsWith("<blockquote") || p.startsWith("<li")) return p;
    return `<p>${p}</p>`;
  }).join("\n");
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// App Initialization
document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  await initAuth();
  await loadArticles();
});
