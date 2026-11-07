/* ==========================================================
   GameZone - features.js
   Owner: Nilesh (Interaction features)
   Loaded AFTER posts.js (uses its data, state and render())
   ========================================================== */

/* ---------- LIKE ---------- */

function likePost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    post.likes += post.liked ? -1 : 1;
    post.liked = !post.liked;

    savePosts();
    render();
}


/* ---------- BOOKMARK ---------- */

function bookmarkPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    post.bookmarked = !post.bookmarked;

    savePosts();
    render();
    notify(post.bookmarked ? "🔖 Post saved!" : "Bookmark removed");
}


/* ---------- COMMENTS ---------- */

function toggleComments(id) {
    const box = document.getElementById(`comments-${id}`);
    if (!box) return;

    box.classList.toggle("show");

    if (box.classList.contains("show")) {
        openComments.add(id);
    } else {
        openComments.delete(id);
    }
}

function addComment(id) {
    const input = document.getElementById(`comment-${id}`);
    const text = input.value.trim();
    if (!text) return;

    const post = posts.find(p => p.id === id);
    if (!post) return;

    post.comments.push(`${ME}: ${text}`);

    drafts[`comment-${id}`] = "";   // clear the saved draft
    openComments.add(id);           // keep the comments open

    savePosts();
    render();
}


/* ---------- SEARCH ---------- */

function searchPosts() {
    searchQuery = document.getElementById("search").value.trim().toLowerCase();
    render();
}


/* ---------- FILTER ---------- */

function initFilters() {
    const bar = document.getElementById("filters");
    const names = ["all", ...GAMES];

    names.forEach(name => {
        const btn = document.createElement("button");
        btn.className = "filter";
        btn.dataset.game = name;
        btn.textContent = name === "all" ? "All" : name;
        btn.addEventListener("click", () => setFilter(name));
        bar.appendChild(btn);
    });
}

function setFilter(game) {
    currentFilter = game;
    render();
}


/* ---------- NAVIGATION ---------- */

function setView(view) {
    currentView = view;
    render();
}

/* Highlights the active nav tab and active filter button */
function updateActiveUI() {
    document.querySelectorAll("nav button[data-view]").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.view === currentView);
    });

    document.querySelectorAll(".filter").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.game === currentFilter);
    });
}


/* ---------- PROFILE MODAL ---------- */

function openProfile() {
    document.getElementById("profileModal").classList.add("show");
}

function closeProfile() {
    document.getElementById("profileModal").classList.remove("show");
}

// close by clicking the dark area or pressing Escape
document.getElementById("profileModal").addEventListener("click", event => {
    if (event.target.id === "profileModal") closeProfile();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeProfile();
});


/* ---------- JOIN GAME (remembered in localStorage) ---------- */

const JOINED_KEY = "joinedGames";

function getJoined() {
    try {
        const saved = JSON.parse(localStorage.getItem(JOINED_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (e) {
        return [];
    }
}

function setJoinedButton(button, joined) {
    button.textContent = joined ? "Joined" : "Join";
    button.classList.toggle("joined", joined);
}

function joinGame(button) {
    const game = button.dataset.game;
    let joined = getJoined();
    const nowJoined = !joined.includes(game);

    joined = nowJoined ? [...joined, game] : joined.filter(g => g !== game);

    try {
        localStorage.setItem(JOINED_KEY, JSON.stringify(joined));
    } catch (e) {
        console.warn("Could not save joined games:", e);
    }

    setJoinedButton(button, nowJoined);
    notify(nowJoined ? `🎮 Joined the ${game} community!` : `Left the ${game} community.`);
}

function restoreJoinedGames() {
    const joined = getJoined();
    document.querySelectorAll(".game button").forEach(button => {
        setJoinedButton(button, joined.includes(button.dataset.game));
    });
}


/* ---------- SHARE ---------- */

function sharePost(id) {
    const link = window.location.href.split("#")[0] + "#post-" + id;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link)
            .then(() => notify("🔗 Post link copied!"))
            .catch(() => notify("Could not copy the link."));
    } else {
        notify("Copying is not supported in this browser.");
    }
}


/* ---------- NOTIFICATIONS (newest 4 are kept) ---------- */

let notifications = ["Welcome to GameZone!"];
const MAX_NOTIFICATIONS = 4;

function renderNotifications() {
    const box = document.getElementById("notifications");

    box.innerHTML = notifications.length === 0
        ? `<p class="muted" style="margin-top:10px">No notifications.</p>`
        : notifications.map(msg => `<div class="notification">${esc(msg)}</div>`).join("");
}

function notify(message) {
    notifications.push(message);

    if (notifications.length > MAX_NOTIFICATIONS) {
        notifications.shift();   // drop the oldest
    }

    renderNotifications();
}

function clearNotifications() {
    notifications = [];
    renderNotifications();
}


/* ---------- START ---------- */

function init() {
    // user name and avatar come from the ME constant in posts.js
    document.getElementById("headerName").textContent = ME;
    document.getElementById("headerAvatar").textContent = ME.charAt(0).toUpperCase();
    document.getElementById("profileName").textContent = ME;

    // game dropdown
    const select = document.getElementById("game");
    GAMES.forEach(game => {
        const option = document.createElement("option");
        option.textContent = game;
        select.appendChild(option);
    });

    initFilters();
    restoreJoinedGames();
    renderNotifications();
    render();
}

init();
