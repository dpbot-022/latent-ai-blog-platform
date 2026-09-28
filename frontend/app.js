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
  followedAuthors: new Set(JSON.parse(localStorage.getItem("latent_followed_authors") || '["dr_elena", "marcus_chen"]')),
  activities: JSON.parse(localStorage.getItem("latent_activities") || "null"),
  currentReadingPost: null,
  otpPendingUsername: null,
  otpTimerInterval: null
};

// DOM Elements
const dom = {
  html: document.documentElement,
  themeToggleBtn: document.getElementById("themeToggleBtn"),
  authNavContainer: document.getElementById("authNavContainer"),
  sidebarUserWidget: document.getElementById("sidebarUserWidget"),
  brandLogoHome: document.getElementById("brandLogoHome"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  searchClearBtn: document.getElementById("searchClearBtn"),
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
  statsStoriesSection: document.getElementById("statsStoriesSection"),
  statsAuditSection: document.getElementById("statsAuditSection"),
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
  authTabs: document.querySelector(".auth-tabs"),
  tabLoginBtn: document.getElementById("tabLoginBtn"),
  tabRegisterBtn: document.getElementById("tabRegisterBtn"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  loginErrorMsg: document.getElementById("loginErrorMsg"),
  registerErrorMsg: document.getElementById("registerErrorMsg"),

  // OTP Verification Elements
  otpStepContainer: document.getElementById("otpStepContainer"),
  otpTargetUsername: document.getElementById("otpTargetUsername"),
  otpTargetEmail: document.getElementById("otpTargetEmail"),
  otpVerifyForm: document.getElementById("otpVerifyForm"),
  otpDigits: [0, 1, 2, 3, 4, 5].map(i => document.getElementById("otp" + i)),
  otpErrorMsg: document.getElementById("otpErrorMsg"),
  otpCountdownTimer: document.getElementById("otpCountdownTimer"),
  submitOtpBtn: document.getElementById("submitOtpBtn"),
  resendOtpBtn: document.getElementById("resendOtpBtn"),
  backToLoginFormBtn: document.getElementById("backToLoginFormBtn"),

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
  coverUploadDropzone: document.getElementById("coverUploadDropzone"),
  uploadDropzonePrompt: document.getElementById("uploadDropzonePrompt"),
  coverPreviewWrapper: document.getElementById("coverPreviewWrapper"),
  coverImagePreview: document.getElementById("coverImagePreview"),
  coverImageName: document.getElementById("coverImageName"),
  coverImageSize: document.getElementById("coverImageSize"),
  changeCoverBtn: document.getElementById("changeCoverBtn"),
  removeCoverBtn: document.getElementById("removeCoverBtn"),
  uploadStatusText: document.getElementById("uploadStatusText"),
  postExcerpt: document.getElementById("postExcerpt"),
  postContent: document.getElementById("postContent"),
  editorWriteTabBtn: document.getElementById("editorWriteTabBtn"),
  editorPreviewTabBtn: document.getElementById("editorPreviewTabBtn"),
  editorWritePane: document.getElementById("editorWritePane"),
  editorPreviewPane: document.getElementById("editorPreviewPane"),
  aiAssistBtn: document.getElementById("aiAssistBtn"),
  editorErrorMsg: document.getElementById("editorErrorMsg"),

  whoToFollowList: document.getElementById("whoToFollowList"),
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
      syncUserState();
    } catch (err) {
      logout();
    }
  } else {
    syncUserState();
  }
  renderAuthNav();
}

function syncUserState() {
  if (state.user) {
    const histKey = `latent_history_ids_${state.user.id}`;
    const savedKey = `latent_saved_ids_${state.user.id}`;
    state.userReadingHistory = JSON.parse(localStorage.getItem(histKey) || "[]");
    state.userSavedPostIds = new Set(JSON.parse(localStorage.getItem(savedKey) || localStorage.getItem("latent_saved_ids") || "[]"));
  } else {
    state.userReadingHistory = [];
    state.userSavedPostIds = new Set();
  }
}

function renderAuthNav() {
  if (state.user) {
    dom.authNavContainer.innerHTML = `
      <div class="auth-nav-relative">
        <button class="user-avatar-btn" id="topUserAvatarBtn" aria-label="Account menu" title="${escapeHtml(state.user.full_name || state.user.username)} (${state.user.role})">
          <img src="${state.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + state.user.username}" 
               class="user-avatar-chip" 
               alt="${escapeHtml(state.user.username)}">
        </button>
        <div class="user-menu-dropdown" id="userMenuDropdown">
          <div class="user-menu-header">
            <div class="user-menu-name">${escapeHtml(state.user.full_name || state.user.username)}</div>
            <div class="user-menu-handle">@${escapeHtml(state.user.username)} · ${state.user.role}</div>
          </div>
          <button class="user-menu-item" id="menuProfileBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile
          </button>
          <button class="user-menu-item" id="menuStoriesBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Your stories
          </button>
          <button class="user-menu-item" id="menuStatsBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Stats
          </button>
          <button class="user-menu-item danger" id="menuLogoutBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign out
          </button>
        </div>
      </div>
    `;

    const avatarBtn = document.getElementById("topUserAvatarBtn");
    const dropdown = document.getElementById("userMenuDropdown");

    avatarBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    });

    document.getElementById("menuProfileBtn").addEventListener("click", () => {
      dropdown.classList.remove("show");
      switchView("profile");
    });

    document.getElementById("menuStoriesBtn").addEventListener("click", () => {
      dropdown.classList.remove("show");
      switchView("stories");
    });

    document.getElementById("menuStatsBtn").addEventListener("click", () => {
      dropdown.classList.remove("show");
      switchView("stats");
    });

    document.getElementById("menuLogoutBtn").addEventListener("click", () => {
      dropdown.classList.remove("show");
      logout();
    });

    // Populate left sidebar user widget
    if (dom.sidebarUserWidget) {
      dom.sidebarUserWidget.style.display = "flex";
      dom.sidebarUserWidget.innerHTML = `
        <img src="${state.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + state.user.username}" class="sidebar-user-avatar" alt="Avatar">
        <div class="sidebar-user-meta">
          <span class="sidebar-user-name">${escapeHtml(state.user.full_name || state.user.username)}</span>
          <span class="sidebar-user-sub">@${escapeHtml(state.user.username)}</span>
        </div>
        <button class="sidebar-logout-btn" id="sidebarLogoutActionBtn" title="Sign Out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      `;
      const sideLogoutBtn = document.getElementById("sidebarLogoutActionBtn");
      if (sideLogoutBtn) sideLogoutBtn.addEventListener("click", logout);
    }

  } else {
    dom.authNavContainer.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button class="secondary-btn" id="openSignInBtn">Sign In</button>
        <button class="primary-btn" id="openSignUpBtn">Get Started</button>
      </div>
    `;
    document.getElementById("openSignInBtn").addEventListener("click", () => openAuthModal("login"));
    document.getElementById("openSignUpBtn").addEventListener("click", () => openAuthModal("register"));

    if (dom.sidebarUserWidget) {
      dom.sidebarUserWidget.style.display = "none";
      dom.sidebarUserWidget.innerHTML = "";
    }
  }
}

// Global click listener to close avatar dropdown
document.addEventListener("click", () => {
  const dropdown = document.getElementById("userMenuDropdown");
  if (dropdown) dropdown.classList.remove("show");
});

function logout() {
  const loggedOutUser = state.user ? (state.user.full_name || state.user.username) : "User";
  addActivity({
    type: "auth",
    title: "Session Terminated",
    text: `<strong>${escapeHtml(loggedOutUser)}</strong> signed out of the platform.`
  });
  state.token = null;
  state.user = null;
  state.userReadingHistory = [];
  state.userSavedPostIds = new Set();
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

    if (state.currentHomeSubtab === "following") {
      renderFollowingFeed();
    } else if (state.currentHomeSubtab === "activity") {
      renderActivityStream();
    } else {
      renderFeedList(state.articles);
    }
    renderStaffPicks(state.articles.slice(0, 3));
    await renderWhoToFollowList();
    syncAllFollowButtons();
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
  if (!state.user) {
    showToast("Please sign in or create an account to save stories.", "info");
    openAuthModal("login");
    return;
  }
  const pId = parseInt(postId);
  const isSaved = state.userSavedPostIds.has(pId);
  const postObj = state.articles.find(p => p.id === pId) || state.currentReadingPost;
  const postTitle = postObj ? postObj.title : `Story #${pId}`;

  if (isSaved) {
    state.userSavedPostIds.delete(pId);
    if (btnElement) btnElement.classList.remove("bookmarked");
    showToast("Story removed from your library.", "info");
  } else {
    state.userSavedPostIds.add(pId);
    if (btnElement) btnElement.classList.add("bookmarked");
    showToast("Story saved to your library.", "success");
    addActivity({
      type: "bookmark",
      title: "Saved to Library",
      text: `You saved <a onclick="openReaderModal(${pId})">${escapeHtml(postTitle)}</a> to your library.`,
      post_id: pId
    });
  }
  const userSavedKey = `latent_saved_ids_${state.user.id}`;
  localStorage.setItem(userSavedKey, JSON.stringify([...state.userSavedPostIds]));
  localStorage.setItem("latent_saved_ids", JSON.stringify([...state.userSavedPostIds]));
  if (state.currentReadingPost && state.currentReadingPost.id === pId) {
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
// Engagement: Like / Clap Toggle with Optimistic UI & Modal/Feed Sync
// ============================================================================
function syncPostClapUI(postId, isLiked, count) {
  const pId = parseInt(postId);
  const post = state.articles.find(p => p.id === pId);
  if (post) post.likes_count = count;

  document.querySelectorAll(`.clap-btn[data-post-id="${pId}"]`).forEach(btn => {
    if (isLiked) btn.classList.add("clapped");
    else btn.classList.remove("clapped");
    const countEl = btn.querySelector(".clap-count");
    if (countEl) countEl.textContent = count;
  });

  if (state.currentReadingPost && state.currentReadingPost.id === pId) {
    if (dom.readerLikeCount) dom.readerLikeCount.textContent = count;
    if (dom.readerLikeBtn) {
      if (isLiked) {
        dom.readerLikeBtn.classList.add("liked");
        dom.readerLikeBtn.classList.add("clapped");
      } else {
        dom.readerLikeBtn.classList.remove("liked");
        dom.readerLikeBtn.classList.remove("clapped");
      }
    }
  }
}

async function handleLikeToggle(postId, btnElement) {
  if (!state.user) {
    showToast("Please sign in to clap for this story.", "info");
    openAuthModal("login");
    return;
  }

  const pId = parseInt(postId);
  const wasLiked = state.userLikedPostIds.has(pId);
  const postObj = state.articles.find(p => p.id === pId) || state.currentReadingPost;
  const currentCount = postObj ? postObj.likes_count : parseInt((dom.readerLikeCount ? dom.readerLikeCount.textContent : "0") || "0");
  const newCount = wasLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

  if (wasLiked) {
    state.userLikedPostIds.delete(pId);
  } else {
    state.userLikedPostIds.add(pId);
  }
  localStorage.setItem("latent_liked_ids", JSON.stringify([...state.userLikedPostIds]));
  syncPostClapUI(pId, !wasLiked, newCount);

  const postTitle = postObj ? postObj.title : `Story #${pId}`;

  try {
    const res = await apiRequest(`/api/v1/posts/${pId}/likes/toggle`, { method: "POST" });
    syncPostClapUI(pId, res.liked, res.likes_count);
    if (res.liked) {
      state.userLikedPostIds.add(pId);
      addActivity({
        type: "like",
        title: "Clapped for Story",
        text: `You clapped for <a onclick="openReaderModal(${pId})">${escapeHtml(postTitle)}</a>`,
        post_id: pId
      });
    } else {
      state.userLikedPostIds.delete(pId);
    }
    localStorage.setItem("latent_liked_ids", JSON.stringify([...state.userLikedPostIds]));
  } catch (err) {
    syncPostClapUI(pId, wasLiked, currentCount);
    if (wasLiked) state.userLikedPostIds.add(pId);
    else state.userLikedPostIds.delete(pId);
    localStorage.setItem("latent_liked_ids", JSON.stringify([...state.userLikedPostIds]));
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

    // Track Reading History for authenticated users only
    if (state.user) {
      const histKey = `latent_history_ids_${state.user.id}`;
      let hist = JSON.parse(localStorage.getItem(histKey) || "[]");
      if (!hist.includes(post.id)) {
        hist.unshift(post.id);
        localStorage.setItem(histKey, JSON.stringify(hist.slice(0, 50)));
      }
      state.userReadingHistory = hist;
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
        addActivity({
          type: "comment",
          title: "Commented on Story",
          text: `You responded to <a onclick="openReaderModal(${post.id})">${escapeHtml(post.title)}</a>: "${escapeHtml(content.substring(0, 60))}${content.length > 60 ? '...' : ''}"`,
          post_id: post.id
        });
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
  if (!state.user) {
    dom.libraryContent.innerHTML = `
      <div class="library-empty-box" style="padding: 3.5rem 2rem;">
        <div style="font-size: 2.75rem; margin-bottom: 1rem;">📚</div>
        <h3>Sign in to access your Library</h3>
        <p>Your saved bookmarks, liked posts, and reading history are securely tied to your personal account.</p>
        <button class="primary-btn" onclick="openAuthModal('login')">Sign In to Latent</button>
      </div>
    `;
    return;
  }

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
    targetIds = state.userReadingHistory || [];
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
    <img src="${user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + user.username}" class="profile-avatar-large" alt="Profile">
    <div class="profile-info-block">
      <h2>${escapeHtml(user.full_name || user.username)}</h2>
      <p style="margin-bottom: 0.35rem;">@${escapeHtml(user.username)} · <span class="cat-badge-small">${user.role}</span></p>
      <p>${escapeHtml(user.bio || 'AI & Data Engineering Architect')}</p>
    </div>
    ${state.user ? `
      <div class="profile-action-group">
        <button class="logout-profile-btn" id="profileSignOutBtn" title="Sign out of your account">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    ` : ''}
  `;

  if (state.user) {
    const profSignOutBtn = document.getElementById("profileSignOutBtn");
    if (profSignOutBtn) profSignOutBtn.addEventListener("click", logout);
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
  const authGate = document.getElementById("statsAuthGate");
  const statsContent = document.getElementById("statsAuthorizedContainer");

  if (!state.user) {
    if (authGate) authGate.style.display = "block";
    if (statsContent) statsContent.style.display = "none";
    return;
  }

  if (authGate) authGate.style.display = "none";
  if (statsContent) statsContent.style.display = "block";

  // Hide or show the admin tab depending on role
  const systemTabBtn = document.querySelector("#viewStats button[data-stattab='system']");
  if (systemTabBtn) {
    systemTabBtn.style.display = state.user.role === "ADMIN" ? "inline-flex" : "none";
  }

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
        { action: "USER_LOGIN", username: state.user.username, resource_type: "auth", created_at: new Date().toISOString(), ip_address: "127.0.0.1" }
      ];
    }

    if (dom.statsAuditTableBody) {
      dom.statsAuditTableBody.innerHTML = auditItems.map(log => `
        <tr>
          <td><code>${escapeHtml(log.action)}</code></td>
          <td>${escapeHtml(log.username || 'anonymous')}</td>
          <td>${escapeHtml(log.resource_type || 'post')}</td>
          <td>${new Date(log.created_at).toLocaleTimeString()}</td>
          <td><code>${escapeHtml(log.ip_address || '127.0.0.1')}</code></td>
        </tr>
      `).join("");
    }

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
    const storiesSec = document.getElementById("statsStoriesSection");
    const auditSec = document.getElementById("statsAuditSection");
    if (subtab === "system") {
      if (storiesSec) storiesSec.style.display = "none";
      if (auditSec) auditSec.style.display = "block";
    } else {
      if (storiesSec) storiesSec.style.display = "block";
      if (auditSec) auditSec.style.display = "none";
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
    dom.postExcerpt.value = post.excerpt;
    dom.postContent.value = post.content;

    // Existing cover image preview
    if (post.cover_image) {
      dom.postCoverUrl.value = post.cover_image;
      dom.coverImagePreview.src = post.cover_image;
      const cleanName = post.cover_image.split("/").pop() || "cover_image";
      dom.coverImageName.textContent = cleanName.length > 25 ? cleanName.substring(0, 22) + "..." : cleanName;
      dom.coverImageSize.textContent = "Current Cover";
      dom.uploadDropzonePrompt.style.display = "none";
      dom.coverPreviewWrapper.style.display = "flex";
      dom.uploadStatusText.textContent = "Click 'Change Image' or drag a new file to replace.";
      dom.uploadStatusText.className = "form-hint";
    } else {
      dom.postCoverUrl.value = "";
      dom.coverImagePreview.src = "";
      dom.uploadDropzonePrompt.style.display = "flex";
      dom.coverPreviewWrapper.style.display = "none";
      dom.uploadStatusText.textContent = "Supported formats: PNG, JPEG, WebP, GIF (Max 5MB)";
      dom.uploadStatusText.className = "form-hint";
    }
  } else {
    dom.editorModalTitle.textContent = "Write a story";
    dom.postEditorForm.reset();
    dom.editPostId.value = "";
    dom.postReadTime.value = 7;
    dom.postCoverUrl.value = "";
    dom.coverImagePreview.src = "";
    dom.uploadDropzonePrompt.style.display = "flex";
    dom.coverPreviewWrapper.style.display = "none";
    dom.uploadStatusText.textContent = "Supported formats: PNG, JPEG, WebP, GIF (Max 5MB)";
    dom.uploadStatusText.className = "form-hint";
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

// Dedicated Cover Image File Upload Handler
async function handleCoverFileUpload(file) {
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!validTypes.includes(file.type)) {
    dom.uploadStatusText.textContent = "Invalid format. Please select PNG, JPG, WebP, or GIF.";
    dom.uploadStatusText.className = "form-hint";
    showToast("Invalid format. Allowed: PNG, JPG, WebP, GIF", "error");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    dom.uploadStatusText.textContent = "File exceeds maximum size of 5MB.";
    dom.uploadStatusText.className = "form-hint";
    showToast("Image exceeds 5MB limit", "error");
    return;
  }

  // Show immediate local preview
  const localPreviewUrl = URL.createObjectURL(file);
  dom.coverImagePreview.src = localPreviewUrl;
  dom.coverImageName.textContent = file.name.length > 25 ? file.name.substring(0, 22) + "..." : file.name;
  dom.coverImageSize.textContent = `${Math.round(file.size / 1024)} KB`;
  dom.uploadDropzonePrompt.style.display = "none";
  dom.coverPreviewWrapper.style.display = "flex";
  dom.uploadStatusText.textContent = `Uploading ${file.name}...`;
  dom.uploadStatusText.className = "form-hint";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await apiRequest("/api/v1/posts/upload-cover", {
      method: "POST",
      body: formData
    });
    dom.postCoverUrl.value = res.url;
    dom.coverImagePreview.src = res.url;
    dom.uploadStatusText.textContent = `Uploaded successfully (${Math.round(res.size_bytes / 1024)} KB)`;
    dom.uploadStatusText.className = "form-hint success";
    showToast("Cover image uploaded successfully!", "success");
  } catch (err) {
    dom.uploadStatusText.textContent = `Upload failed: ${err.message}`;
    dom.uploadStatusText.className = "form-hint";
    showToast(`Upload failed: ${err.message}`, "error");
    if (!dom.postCoverUrl.value) {
      dom.uploadDropzonePrompt.style.display = "flex";
      dom.coverPreviewWrapper.style.display = "none";
    }
  }
}

// Dropzone click triggers hidden file input
if (dom.coverUploadDropzone) {
  dom.coverUploadDropzone.addEventListener("click", (e) => {
    if (e.target.closest("#changeCoverBtn") || e.target.closest("#removeCoverBtn")) return;
    if (dom.uploadDropzonePrompt.style.display !== "none") {
      dom.coverFileInput.click();
    }
  });

  // Drag and drop listeners
  ["dragenter", "dragover"].forEach(eventName => {
    dom.coverUploadDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.coverUploadDropzone.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(eventName => {
    dom.coverUploadDropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dom.coverUploadDropzone.classList.remove("dragover");
    });
  });

  dom.coverUploadDropzone.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleCoverFileUpload(dt.files[0]);
    }
  });
}

// Change cover image button
if (dom.changeCoverBtn) {
  dom.changeCoverBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dom.coverFileInput.click();
  });
}

// Remove cover image button
if (dom.removeCoverBtn) {
  dom.removeCoverBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dom.postCoverUrl.value = "";
    dom.coverFileInput.value = "";
    dom.coverImagePreview.src = "";
    dom.uploadDropzonePrompt.style.display = "flex";
    dom.coverPreviewWrapper.style.display = "none";
    dom.uploadStatusText.textContent = "Supported formats: PNG, JPEG, WebP, GIF (Max 5MB)";
    dom.uploadStatusText.className = "form-hint";
  });
}

// File picker change
if (dom.coverFileInput) {
  dom.coverFileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleCoverFileUpload(file);
  });
}

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
    cover_image: dom.postCoverUrl.value.trim() || undefined,
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
      const createdPost = await apiRequest("/api/v1/posts", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showToast("Story published to Latent!", "success");
      addActivity({
        type: "publish",
        title: "New Story Published",
        text: `You published <a onclick="openReaderModal(${createdPost.id})">${escapeHtml(createdPost.title)}</a> in ${escapeHtml(createdPost.category)}`,
        post_id: createdPost.id
      });
    }
    closeEditorModal();
    await loadArticles();
    await renderWhoToFollowList();
  } catch (err) {
    dom.editorErrorMsg.textContent = err.message;
    dom.editorErrorMsg.style.display = "block";
  }
});


// ============================================================================
// Auth Modals & First-Time Login OTP Filter
// ============================================================================
function openAuthModal(tab = "login") {
  dom.authModal.classList.add("active");
  document.body.style.overflow = "hidden";
  dom.loginErrorMsg.style.display = "none";
  dom.registerErrorMsg.style.display = "none";
  if (dom.otpErrorMsg) dom.otpErrorMsg.style.display = "none";

  // Reset inputs
  if (dom.loginForm) dom.loginForm.reset();
  if (dom.registerForm) dom.registerForm.reset();

  // Stop any active OTP timer
  if (state.otpTimerInterval) {
    clearInterval(state.otpTimerInterval);
    state.otpTimerInterval = null;
  }

  // Restore tabs and hide OTP screen
  if (dom.authTabs) dom.authTabs.style.display = "flex";
  if (dom.otpStepContainer) dom.otpStepContainer.style.display = "none";

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
  if (state.otpTimerInterval) {
    clearInterval(state.otpTimerInterval);
    state.otpTimerInterval = null;
  }
}

function showOtpVerificationStep(otpData) {
  state.otpPendingUsername = otpData.username;

  // Hide forms and tabs
  if (dom.authTabs) dom.authTabs.style.display = "none";
  dom.loginForm.style.display = "none";
  dom.registerForm.style.display = "none";

  // Show OTP Step
  dom.otpStepContainer.style.display = "flex";
  dom.otpTargetUsername.textContent = otpData.username;
  dom.otpTargetEmail.textContent = otpData.email_masked || "registered email";
  if (dom.otpErrorMsg) dom.otpErrorMsg.style.display = "none";

  // Reset inputs
  dom.otpDigits.forEach(input => {
    input.value = "";
    input.classList.remove("filled");
  });

  // Focus first digit box
  setTimeout(() => dom.otpDigits[0].focus(), 100);

  // Start 10-minute countdown (600s)
  startOtpCountdown(600);
}

function startOtpCountdown(secondsTotal) {
  if (state.otpTimerInterval) clearInterval(state.otpTimerInterval);

  let remaining = secondsTotal;
  const updateTimerDisplay = () => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    dom.otpCountdownTimer.textContent = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  updateTimerDisplay();

  state.otpTimerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(state.otpTimerInterval);
      state.otpTimerInterval = null;
      dom.otpCountdownTimer.textContent = "Expired";
      if (dom.otpErrorMsg) {
        dom.otpErrorMsg.textContent = "Your verification code has expired. Please click 'Resend OTP'.";
        dom.otpErrorMsg.style.display = "block";
      }
    } else {
      updateTimerDisplay();
    }
  }, 1000);
}

// Setup Digit Inputs Navigation & Paste handling
dom.otpDigits.forEach((input, idx) => {
  if (!input) return;
  // Input event: auto advance
  input.addEventListener("input", () => {
    const val = input.value.replace(/\D/g, "");
    input.value = val ? val[val.length - 1] : "";
    if (input.value) {
      input.classList.add("filled");
      if (idx < 5) {
        dom.otpDigits[idx + 1].focus();
      }
    } else {
      input.classList.remove("filled");
    }

    // Auto-submit or focus submit if all 6 filled
    const allFilled = dom.otpDigits.every(d => d && d.value.length === 1);
    if (allFilled) {
      dom.submitOtpBtn.focus();
    }
  });

  // Keydown event: backspace navigation
  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace") {
      if (!input.value && idx > 0) {
        dom.otpDigits[idx - 1].focus();
        dom.otpDigits[idx - 1].value = "";
        dom.otpDigits[idx - 1].classList.remove("filled");
      } else {
        input.value = "";
        input.classList.remove("filled");
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      dom.otpDigits[idx - 1].focus();
    } else if (e.key === "ArrowRight" && idx < 5) {
      dom.otpDigits[idx + 1].focus();
    }
  });

  // Paste event: paste full 6-digit code
  input.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      pasted.split("").forEach((char, i) => {
        if (dom.otpDigits[i]) {
          dom.otpDigits[i].value = char;
          dom.otpDigits[i].classList.add("filled");
        }
      });
      const nextIdx = Math.min(pasted.length, 5);
      if (pasted.length === 6) {
        dom.submitOtpBtn.focus();
      } else {
        dom.otpDigits[nextIdx].focus();
      }
    }
  });
});


// Return to Login screen
if (dom.backToLoginFormBtn) {
  dom.backToLoginFormBtn.addEventListener("click", () => {
    openAuthModal("login");
  });
}

// Resend OTP button
if (dom.resendOtpBtn) {
  dom.resendOtpBtn.addEventListener("click", async () => {
    if (!state.otpPendingUsername) return;
    try {
      dom.resendOtpBtn.disabled = true;
      dom.resendOtpBtn.textContent = "Sending...";
      const res = await apiRequest("/api/v1/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ username: state.otpPendingUsername })
      });
      if (res.demo_otp_hint) {
        dom.otpDemoCodeValue.textContent = res.demo_otp_hint;
      }
      startOtpCountdown(600);
      dom.otpDigits.forEach(d => { d.value = ""; d.classList.remove("filled"); });
      dom.otpDigits[0].focus();
      if (dom.otpErrorMsg) dom.otpErrorMsg.style.display = "none";
      showToast("Fresh 6-digit verification code sent to your email!", "info");
    } catch (err) {
      showToast(err.message, "danger");
    } finally {
      dom.resendOtpBtn.disabled = false;
      dom.resendOtpBtn.textContent = "Didn't receive code? Resend OTP";
    }
  });
}

// Verify OTP Form Submission
if (dom.otpVerifyForm) {
  dom.otpVerifyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (dom.otpErrorMsg) dom.otpErrorMsg.style.display = "none";

    const otpCode = dom.otpDigits.map(d => d.value).join("");
    if (otpCode.length !== 6) {
      if (dom.otpErrorMsg) {
        dom.otpErrorMsg.textContent = "Please enter all 6 digits of your verification code.";
        dom.otpErrorMsg.style.display = "block";
      }
      return;
    }

    try {
      dom.submitOtpBtn.disabled = true;
      dom.submitOtpBtn.querySelector("span").textContent = "Verifying code...";

      const res = await apiRequest("/api/v1/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({
          username: state.otpPendingUsername,
          otp_code: otpCode
        })
      });

      // Verification successful: save JWT token and user
      state.token = res.access_token;
      state.user = res.user;
      localStorage.setItem("latent_token", state.token);
      syncUserState();
      closeAuthModal();
      renderAuthNav();
      showToast(`🎉 Verification complete! Welcome to Latent, ${state.user.full_name || state.user.username}!`, "success");
      loadArticles();
    } catch (err) {
      if (dom.otpErrorMsg) {
        dom.otpErrorMsg.textContent = err.message;
        dom.otpErrorMsg.style.display = "block";
      }
      dom.otpDigits.forEach(d => d && d.classList.add("error"));
      setTimeout(() => dom.otpDigits.forEach(d => d && d.classList.remove("error")), 800);
    } finally {
      dom.submitOtpBtn.disabled = false;
      dom.submitOtpBtn.querySelector("span").textContent = "Verify & Complete Sign In";
    }
  });
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

    // Check if First-Time Login OTP is required!
    if (res.requires_otp) {
      showOtpVerificationStep(res);
      showToast("🔐 First-time login detected. Enter the OTP sent to your email.", "info");
      return;
    }

    // Direct login for verified user
    state.token = res.access_token;
    state.user = res.user;
    localStorage.setItem("latent_token", state.token);
    syncUserState();
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
    const regRes = await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, full_name, email, password, role })
    });

    showToast(`Account created for ${regRes.username}! Dispatched first-time security verification.`, "success");

    // Automatically trigger first-time login to transition directly to the OTP screen!
    try {
      const loginRes = await apiRequest("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      if (loginRes.requires_otp) {
        showOtpVerificationStep(loginRes);
        return;
      }
    } catch (loginErr) {
      // Fallback: switch to login tab with prefilled username
      openAuthModal("login");
      document.getElementById("loginUsername").value = username;
      document.getElementById("loginPassword").focus();
    }
  } catch (err) {
    dom.registerErrorMsg.textContent = err.message;
    dom.registerErrorMsg.style.display = "block";
  }
});

// ============================================================================
// Controls: Subtabs, Categories, Search
// ============================================================================
// Home Subtabs (For You, Following, Activity)
// ============================================================================
// Live Activity Tracking & Dynamic Stream
// ============================================================================
const defaultActivities = [
  {
    type: "like",
    icon: "♥",
    text: `<strong>Dr. Elena Vance</strong> clapped for <a onclick="openReaderModal(1)">DeepSeek–V3 Architecture: Multi-Head Latent Attention (MLA) Deep Dive</a>`,
    time: Date.now() - 12 * 60 * 1000
  },
  {
    type: "comment",
    icon: "💬",
    text: `<strong>Marcus Chen</strong> responded to <a onclick="openReaderModal(2)">Hybrid Search at Scale: Combining Sparse BM25 with Dense HNSW Vectors</a>`,
    time: Date.now() - 34 * 60 * 1000
  },
  {
    type: "publish",
    icon: "✦",
    text: `<strong>Sarah Jenkins</strong> published <a onclick="openReaderModal(3)">The Modern Lakehouse Architecture: Apache Iceberg & Trino Deep Dive</a>`,
    time: Date.now() - 2 * 60 * 60 * 1000
  },
  {
    type: "follow",
    icon: "👤",
    text: `<strong>Marcus Chen</strong> started following <strong>Dr. Elena Vance</strong>`,
    time: Date.now() - 4 * 60 * 60 * 1000
  }
];

function formatTimeAgo(ts) {
  if (!ts) return "Just now";
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function addActivity(act) {
  if (!state.activities || !Array.isArray(state.activities) || state.activities.length === 0) {
    state.activities = [...defaultActivities];
  }
  const entry = {
    type: act.type || "auth",
    icon: act.type === "like" ? "♥" : act.type === "comment" ? "💬" : act.type === "bookmark" ? "🔖" : act.type === "follow" ? "👤" : act.type === "publish" ? "✦" : "🛡️",
    text: act.text || act.title,
    time: act.timestamp || Date.now()
  };
  state.activities.unshift(entry);
  if (state.activities.length > 50) state.activities.pop();
  localStorage.setItem("latent_activities", JSON.stringify(state.activities));

  if (state.currentHomeSubtab === "activity" && dom.views.home.classList.contains("active")) {
    renderActivityStream();
  }
}

function renderActivityStream() {
  if (!state.activities || !Array.isArray(state.activities) || state.activities.length === 0) {
    state.activities = [...defaultActivities];
  }

  dom.articlesGrid.innerHTML = `
    <div style="padding: 1.5rem 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <h3 style="font-size: 1.2rem; font-weight: 700; margin: 0;">Live Community & User Activity</h3>
        <button class="secondary-btn" id="clearActivityBtn" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">Clear Stream</button>
      </div>
      <div class="activity-stream-timeline">
        ${state.activities.map(act => `
          <div class="activity-item-card">
            <div class="activity-icon-badge ${act.type}">
              ${act.icon || "•"}
            </div>
            <div class="activity-body">
              <div class="activity-body-text">${act.text}</div>
              <span class="activity-timestamp">${formatTimeAgo(act.time)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  const clearBtn = document.getElementById("clearActivityBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      state.activities = [];
      localStorage.removeItem("latent_activities");
      renderActivityStream();
      showToast("Activity stream cleared.", "info");
    });
  }
}

// ============================================================================
// Who to Follow Recommendations (Dynamic from Published Authors)
// ============================================================================
let cachedPublishedAuthors = [];

async function renderWhoToFollowList() {
  if (!dom.whoToFollowList) return;

  try {
    let authors = [];
    try {
      authors = await apiRequest("/api/v1/posts/authors/published");
      cachedPublishedAuthors = authors;
    } catch (apiErr) {
      // Fallback: extract unique authors from state.articles
      const authorMap = new Map();
      (state.articles || []).forEach(post => {
        if (post.author && !authorMap.has(post.author.username)) {
          authorMap.set(post.author.username, {
            id: post.author.id,
            username: post.author.username,
            full_name: post.author.full_name || post.author.username,
            avatar_url: post.author.avatar_url,
            bio: `${post.author.role || "Author"} • Technical Lead`,
            articles_count: 1
          });
        }
      });
      authors = Array.from(authorMap.values());
      cachedPublishedAuthors = authors;
    }

    if (!authors || authors.length === 0) {
      dom.whoToFollowList.innerHTML = `<div style="padding: 0.75rem; font-size: 0.8rem; color: var(--text-muted);">No published authors yet.</div>`;
      return;
    }

    dom.whoToFollowList.innerHTML = authors.map(author => {
      const isFollowing = state.followedAuthors.has(author.username);
      const isCurrentUser = state.user && state.user.username === author.username;
      const avatar = author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${author.username}`;
      const subtitle = author.bio || `${author.role || "Author"} • ${author.articles_count} publication${author.articles_count === 1 ? '' : 's'}`;

      return `
        <div class="follow-user-row" data-author="${escapeHtml(author.username)}">
          <img src="${avatar}" class="follow-avatar" alt="${escapeHtml(author.full_name || author.username)}">
          <div class="follow-info">
            <span class="follow-name">${escapeHtml(author.full_name || author.username)}${isCurrentUser ? ' <small style="color:var(--text-muted);font-weight:400;">(You)</small>' : ''}</span>
            <span class="follow-desc" title="${escapeHtml(subtitle)}">${escapeHtml(subtitle)}</span>
          </div>
          ${!isCurrentUser ? `
            <button class="follow-btn ${isFollowing ? 'following' : ''}" data-author="${escapeHtml(author.username)}" data-author-name="${escapeHtml(author.full_name || author.username)}">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          ` : `
            <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600; padding: 0.2rem 0.5rem; background: var(--bg-hover); border-radius: var(--radius-xs);">Author</span>
          `}
        </div>
      `;
    }).join("");

    syncAllFollowButtons();
  } catch (err) {
    console.error("Failed to render Who to Follow list:", err);
  }
}

// ============================================================================
// Following Feed & Dynamic Follow Management
// ============================================================================
function syncAllFollowButtons() {
  document.querySelectorAll(".follow-btn").forEach(btn => {
    const author = btn.getAttribute("data-author");
    if (!author) return;
    const isFollowing = state.followedAuthors.has(author);
    if (isFollowing) {
      btn.classList.add("following");
      btn.textContent = "Following";
    } else {
      btn.classList.remove("following");
      btn.textContent = "Follow";
    }
  });
}

function renderFollowingFeed() {
  const followed = state.articles.filter(p => state.followedAuthors.has(p.author.username));
  if (followed.length > 0) {
    renderFeedList(followed);
  } else {
    const suggestedAuthors = cachedPublishedAuthors.filter(a => !state.user || a.username !== state.user.username).slice(0, 4);
    dom.articlesGrid.innerHTML = `
      <div class="following-empty-state">
        <div style="font-size: 2.2rem; margin-bottom: 0.75rem;">👥</div>
        <h3>You are not following any authors yet</h3>
        <p>Follow top engineering leads and researchers below to populate your customized feed with their latest systems deep dives.</p>
        <div class="following-suggested-grid">
          ${suggestedAuthors.map(author => {
            const avatar = author.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${author.username}`;
            const role = author.bio ? author.bio.split("•")[0].trim() : `${author.role} • ${author.articles_count} articles`;
            return `
              <div class="suggested-author-card">
                <img src="${avatar}" class="suggested-author-avatar" alt="${escapeHtml(author.full_name || author.username)}">
                <div class="suggested-author-meta">
                  <span class="suggested-author-name">${escapeHtml(author.full_name || author.username)}</span>
                  <span class="suggested-author-role">${escapeHtml(role)}</span>
                </div>
                <button class="follow-btn" data-author="${escapeHtml(author.username)}" data-author-name="${escapeHtml(author.full_name || author.username)}">Follow</button>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    syncAllFollowButtons();
  }
}


// Global click delegation for all follow buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".follow-btn");
  if (!btn) return;
  const author = btn.getAttribute("data-author");
  const authorName = btn.getAttribute("data-author-name") || author;
  if (!author) return;

  if (state.followedAuthors.has(author)) {
    state.followedAuthors.delete(author);
    showToast(`Unfollowed ${authorName}`, "info");
    addActivity({
      type: "follow",
      title: "Author Unfollowed",
      text: `You unfollowed <strong>${escapeHtml(authorName)}</strong>`
    });
  } else {
    state.followedAuthors.add(author);
    showToast(`You are now following ${authorName}!`, "success");
    addActivity({
      type: "follow",
      title: "New Follow",
      text: `You started following <strong>${escapeHtml(authorName)}</strong>`
    });
  }

  localStorage.setItem("latent_followed_authors", JSON.stringify([...state.followedAuthors]));
  syncAllFollowButtons();

  if (state.currentHomeSubtab === "following") {
    renderFollowingFeed();
  }
});

// Home Subtabs (For You, Following, Activity)
document.querySelectorAll(".feed-tabs-list .feed-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".feed-tabs-list .feed-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const subtab = btn.getAttribute("data-subtab");
    state.currentHomeSubtab = subtab;

    if (subtab === "following") {
      renderFollowingFeed();
    } else if (subtab === "activity") {
      renderActivityStream();
    } else {
      renderFeedList(state.articles);
    }
  });
});

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

// Search input with Clear Button & Keyboard Shortcut
let searchTimer = null;
if (dom.globalSearchInput) {
  dom.globalSearchInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (dom.searchClearBtn) {
      dom.searchClearBtn.style.display = val ? "block" : "none";
    }
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.searchQuery = val.trim();
      switchView("home");
      loadArticles();
    }, 250);
  });
}

if (dom.searchClearBtn) {
  dom.searchClearBtn.addEventListener("click", () => {
    dom.globalSearchInput.value = "";
    dom.searchClearBtn.style.display = "none";
    state.searchQuery = "";
    dom.globalSearchInput.focus();
    switchView("home");
    loadArticles();
  });
}

// Global '/' shortcut to focus search
document.addEventListener("keydown", (e) => {
  if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    e.preventDefault();
    if (dom.globalSearchInput) {
      dom.globalSearchInput.focus();
      dom.globalSearchInput.select();
    }
  }
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
  if (dom.globalSearchInput) dom.globalSearchInput.value = "";
  if (dom.searchClearBtn) dom.searchClearBtn.style.display = "none";
  document.querySelectorAll(".cat-chip").forEach(c => c.classList.remove("active"));
  const defaultChip = document.querySelector(".cat-chip[data-category='']");
  if (defaultChip) defaultChip.classList.add("active");
  loadArticles();
}

if (dom.exportAllCsvBtn) {
  dom.exportAllCsvBtn.addEventListener("click", () => {
    window.location.href = "/api/v1/export/posts/csv";
    showToast("Downloading catalog CSV...", "success");
  });
}

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
  await renderWhoToFollowList();
});

