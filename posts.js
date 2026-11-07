/* ==========================================================
   GameZone - posts.js
   Owner: Piyush (Posts system: data, storage, rendering)
   Loaded BEFORE features.js
   ========================================================== */

/* ---------- SETTINGS ---------- */

const ME = "Tony";                       // current user's name (change in one place)
const STORAGE_KEY = "gamePosts";

const GAMES = [
    "General Gaming", "Valorant", "Minecraft", "Fortnite",
    "GTA V", "CS2", "Apex Legends", "League of Legends"
];


/* ---------- DATA ---------- */

const defaultPosts = [
    { id: 1, user: "Alex", game: "Valorant",
      text: "What is the best agent for beginners?",
      likes: 15, liked: false, bookmarked: false, comments: [] },

    { id: 2, user: "GamerPro", game: "Minecraft",
      text: "Show me your coolest Minecraft builds!",
      likes: 23, liked: false, bookmarked: false, comments: [] },

    { id: 3, user: "Shadow", game: "Fortnite",
      text: "What landing spot are you using this season?",
      likes: 9, liked: false, bookmarked: false, comments: [] }
];

function loadPosts() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (Array.isArray(saved)) {
            // older saves used "You" as the username
            saved.forEach(p => { if (p.user === "You") p.user = ME; });
            return saved;
        }
    } catch (e) {
        console.warn("Could not read saved posts:", e);
    }
    return defaultPosts;
}

let posts = loadPosts();

function savePosts() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
        console.warn("Could not save posts:", e);
    }
}


/* ---------- APP STATE (what the screen currently shows) ---------- */

let currentView = "home";        // "home" | "trending" | "bookmarks"
let currentFilter = "all";       // "all" or a game name
let searchQuery = "";            // lowercase search text
const openComments = new Set();  // ids of posts whose comments are open
const drafts = {};               // unsent comment text, keyed by input id


/* ---------- SECURITY: escape user text before using innerHTML ---------- */

function esc(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


/* ---------- WHICH POSTS TO SHOW ---------- */

function getVisiblePosts() {
    let list = [...posts];

    if (currentView === "bookmarks") {
        list = list.filter(p => p.bookmarked);
    }

    if (currentFilter !== "all") {
        list = list.filter(p => p.game === currentFilter);
    }

    if (searchQuery) {
        list = list.filter(p =>
            p.text.toLowerCase().includes(searchQuery) ||
            p.game.toLowerCase().includes(searchQuery) ||
            p.user.toLowerCase().includes(searchQuery)
        );
    }

    if (currentView === "trending") {
        list.sort((a, b) => b.likes - a.likes);
    }

    return list;
}

function emptyMessage() {
    if (currentView === "bookmarks" && !searchQuery && currentFilter === "all") {
        return "No saved posts yet. Press Save on a post to bookmark it.";
    }
    return "No posts found.";
}


/* ---------- RENDERING ---------- */

function postHTML(post) {
    const isOpen = openComments.has(post.id);
    const isMine = post.user === ME;

    return `
    <div class="post" id="post-${post.id}">

        <div class="post-header">
            <div class="user">
                <div class="small-avatar">${esc(post.user.charAt(0).toUpperCase())}</div>
                <strong>${esc(post.user)}</strong>
            </div>
        </div>

        <h3>${esc(post.text)}</h3>

        <span class="game-tag">🎮 ${esc(post.game)}</span>

        <div class="actions">
            <button class="action ${post.liked ? "active" : ""}"
                    aria-pressed="${post.liked}"
                    onclick="likePost(${post.id})">
                👍 ${post.likes}
            </button>

            <button class="action"
                    onclick="toggleComments(${post.id})">
                💬 ${post.comments.length}
            </button>

            <button class="action ${post.bookmarked ? "active" : ""}"
                    aria-pressed="${post.bookmarked}"
                    onclick="bookmarkPost(${post.id})">
                🔖 ${post.bookmarked ? "Saved" : "Save"}
            </button>

            <button class="action" onclick="sharePost(${post.id})">↗️ Share</button>

            ${isMine ? `
            <button class="action" onclick="deletePost(${post.id})">🗑️ Delete</button>
            ` : ""}
        </div>

        <div class="comments ${isOpen ? "show" : ""}" id="comments-${post.id}">
            ${post.comments.map(c => `<div class="comment">👤 ${esc(c)}</div>`).join("")}

            <div class="comment-input">
                <input id="comment-${post.id}"
                       placeholder="Write a comment..."
                       aria-label="Write a comment">
                <button class="primary" onclick="addComment(${post.id})">Send</button>
            </div>
        </div>

    </div>`;
}

function updateStats() {
    const mine = posts.filter(p => p.user === ME);
    const likes = mine.reduce((total, p) => total + p.likes, 0);

    document.getElementById("postCount").textContent = posts.length;
    document.getElementById("myPosts").textContent = mine.length;
    document.getElementById("myLikes").textContent = likes;

    // reputation = 10 points per post + 5 points per like received
    document.getElementById("myReputation").textContent = mine.length * 10 + likes * 5;
}

/* The single function that redraws the post list.
   Every action changes the data/state, then calls render(). */
function render() {
    const container = document.getElementById("posts");

    // keep half-typed comments when the list is redrawn
    document.querySelectorAll(".comment-input input").forEach(input => {
        drafts[input.id] = input.value;
    });

    const list = getVisiblePosts();

    container.innerHTML = list.length === 0
        ? `<div class="card"><p>${emptyMessage()}</p></div>`
        : list.map(postHTML).join("");

    Object.keys(drafts).forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = drafts[id];
    });

    updateStats();
    updateActiveUI();   // defined in features.js
}


/* ---------- CREATE / DELETE ---------- */

function createPost() {
    const textBox = document.getElementById("postText");
    const text = textBox.value.trim();
    const game = document.getElementById("game").value;

    if (!text) {
        alert("Please write something first!");
        return;
    }

    posts.unshift({
        id: Date.now(),
        user: ME,
        game: game,
        text: text,
        likes: 0,
        liked: false,
        bookmarked: false,
        comments: []
    });

    textBox.value = "";
    savePosts();
    render();
    notify("🎉 Your post was published!");
}

function deletePost(id) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    posts = posts.filter(p => p.id !== id);
    openComments.delete(id);

    savePosts();
    render();
    notify("Post deleted.");
}
