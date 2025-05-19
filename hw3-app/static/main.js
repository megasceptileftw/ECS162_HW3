const DOTW  = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTH = ["January","February","March","April","May","June","July","August","September","October","November","December"];

//  1. Date Banner 
function initializeDate() {
  const el = document.getElementById("dateArea");
  const d = new Date();
  el.textContent = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

const accountBtn = document.getElementById("accountBtn");
const isModerator = accountBtn && accountBtn.dataset.moderator === "true";
if (accountBtn) {
  accountBtn.onclick = () => openAccountSidebar(accountBtn.dataset.email);
}


//  2. Fetch Articles 
function fetchArticles() {
  fetch("/api/articles")
    .then(res => res.json())
    .then(data => loadArticles(data.articles))
    .catch(err => console.error("Article load fail:", err));
}

//  3. Render Articles 
let commentCounts = {};

function fetchCommentCounts() {
  return fetch("/api/comments")
    .then(res => res.json())
    .then(data => { commentCounts = data.counts || {}; })
    .catch(err => console.error("Could not fetch comment counts:", err));
}

function loadArticles(articles) {
  const [center, left, right] = [
    ".centerColumn",
    ".leftColumn",
    ".rightColumn"
  ].map(sel => document.querySelector(sel));

  [center, left, right].forEach(col => col.innerHTML = "");

  articles.forEach((art, i) => {
    const col = [center, left, right][i % 3];
    const el = document.createElement("article");
    el.dataset.articleUrl = art.web_url;

    if (art.multimedia && art.multimedia.default && art.multimedia.default.url) {
      const img = document.createElement("img");
      img.src = art.multimedia.default.url;
      img.alt = art.headline && art.headline.main ? art.headline.main : "Article image";
      el.appendChild(img);
    }

    const header = document.createElement("p");
    header.className = "articleHeader";
    header.textContent = art.headline.main;
    el.appendChild(header);

    const summary = document.createElement("p");
    summary.textContent = art.abstract;
    el.appendChild(summary);

    const btn = document.createElement("button");
    btn.className = "comment-toggle-btn";

    const span = document.createElement("span");
    span.className = "comment-count";
    span.textContent = commentCounts[art.web_url] || 0;

    btn.innerHTML = "💬 ";
    btn.appendChild(span);
    btn.onclick = () => openSidebar(art.web_url, art.headline.main);
    el.appendChild(btn);

    col.appendChild(el);
  });
}

//  4. Comment Sidebar 
let currentArticleURL = null;

const sidebar      = document.getElementById("commentSidebar");
const closeBtn     = document.getElementById("closeSidebarBtn");
const scrollArea   = document.getElementById("commentsScrollArea");
const commentForm  = document.getElementById("commentForm");
const commentInput = document.getElementById("commentText");
const sidebarTitle = document.getElementById("sidebarArticleTitle");

if (closeBtn) {
  closeBtn.onclick = () => sidebar.classList.remove("open");
}

if (commentForm) {
  commentForm.onsubmit = e => {
    e.preventDefault();
    postComment(currentArticleURL, commentInput.value.trim());
    commentInput.value = "";
  };
}

function openSidebar(articleURL, title = "Comments") {
  currentArticleURL = articleURL;
  sidebarTitle.textContent = title;
  sidebar.classList.add("open");

  // Clear scrollArea and add the heading properly
  scrollArea.innerHTML = ""; // done before appending any children

  const heading = document.createElement("h3");
  heading.id = "commentHeading";

  heading.textContent = "Comments ";

  const span = document.createElement("span");
  span.id = "commentCount";
  span.textContent = "0";

  heading.appendChild(span);
  scrollArea.appendChild(heading);

  if (commentForm) {
    commentForm.style.display = "block";
    scrollArea.appendChild(commentForm);
  }

  fetchComments(articleURL);
}


function openAccountSidebar(email) {
  currentArticleURL = null;
  sidebarTitle.textContent = email;
  sidebar.classList.add("open");

  // Clear previous content 
  scrollArea.innerHTML = "";

  const greeting = document.createElement("p");
  greeting.textContent = "Good afternoon.";
  greeting.style.fontSize = "1.25rem";
  greeting.style.fontWeight = "500";
  greeting.style.margin = "1rem";
  scrollArea.appendChild(greeting);

  const bottomContainer = document.createElement("div");
  bottomContainer.style.position = "absolute";
  bottomContainer.style.bottom = "1.5rem";
  bottomContainer.style.left = "1.5rem";

  const form = document.createElement("form");
  form.action = "/logout";
  form.method = "get";

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Log out";
  button.style.background = "none";
  button.style.border = "none";
  button.style.fontWeight = "bold";
  button.style.fontSize = "0.9rem";

  form.appendChild(button);
  bottomContainer.appendChild(form);
  scrollArea.appendChild(bottomContainer);

  if (commentForm) commentForm.style.display = "none";
}


function fetchComments(articleURL) {
  fetch(`/api/comments?url=${encodeURIComponent(articleURL)}`)
    .then(res => res.json())
    .then(data => {
      const comments = data.comments || [];
      const totalCount = comments.reduce((acc, c) => {
        const replyCount = (c.replies && c.replies.length) || 0;
        return acc + 1 + replyCount;
      }, 0);
      document.getElementById("commentCount").textContent = totalCount;

      const oldList = document.getElementById("commentList");
      if (oldList) oldList.remove();

      const list = document.createElement("div");
      list.id = "commentList";

      comments.forEach(c => list.appendChild(createCommentElement(c, articleURL)));
      scrollArea.appendChild(list);
    })
    .catch(err => console.error("Failed to load comments:", err));
}


function createCommentElement(comment, articleURL) {
  const item = document.createElement("div");
  item.className = "comment-item";

  const author = document.createElement("p");
  author.className = "comment-author";
  author.textContent = `• ${comment.user || "anonymous"}`;
  item.appendChild(author);

  const text = document.createElement("p");
  text.className = "comment-text";
  text.textContent = comment.moderated ? "COMMENT REMOVED BY MODERATOR!" : comment.text;
  item.appendChild(text);

  const replyForm = document.createElement("div");
  replyForm.className = "reply-form hidden"; // hidden class in CSS should set display: none

  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write a reply…";
  replyForm.appendChild(textarea);

  const replyBtn = document.createElement("button");
  replyBtn.className = "submit-reply";
  replyBtn.textContent = "Post";
  replyForm.appendChild(replyBtn);

  item.appendChild(replyForm);

  const repliesDiv = document.createElement("div");
  repliesDiv.className = "replies";
  item.appendChild(repliesDiv);

  item.insertBefore(createActionRow(comment, articleURL), repliesDiv);

  (comment.replies || []).forEach((reply, i) => {
    repliesDiv.appendChild(createReplyElement(reply, i, comment, articleURL));
  });

  // Reply toggle
  item.querySelector(".reply-btn").onclick = () => {
    replyForm.classList.toggle("hidden");
  };

  replyBtn.onclick = () => {
    const replyText = textarea.value.trim();
    if (!replyText) return;

    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_url: articleURL,
        text: replyText,
        parent_id: comment._id
      })
    })
    .then(res => res.json())
    .then(() => {
      fetchComments(articleURL);
      return fetchCommentCounts().then(fetchArticles);
      return 
    });
  };

  return item;
}

function createActionRow(comment, articleURL) {
  const row = document.createElement("div");
  row.className = "action-row"; // Use class for styling

  const replyBtn = document.createElement("button");
  replyBtn.textContent = "Reply";
  replyBtn.className = "reply-btn";
  row.appendChild(replyBtn);

  if (isModerator) {
    const modBtn = document.createElement("button");
    modBtn.textContent = "Remove";
    modBtn.onclick = () => {
      fetch("/api/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: comment._id })
      }).then(() => fetchComments(articleURL));
    };
    row.appendChild(modBtn);
  }

  return row;
}

function createReplyElement(reply, index, parentComment, articleURL) {
  const replyEl = document.createElement("div");
  replyEl.className = "reply";

  const author = document.createElement("p");
  author.className = "comment-author";
  author.textContent = `↳ ${reply.user}`;
  replyEl.appendChild(author);

  const text = document.createElement("p");
  text.className = "comment-text";
  text.textContent = reply.moderated ? "COMMENT REMOVED BY MODERATOR!" : reply.text;
  replyEl.appendChild(text);

  if (isModerator) {
    const modBtn = document.createElement("button");
    modBtn.textContent = "Remove";
    modBtn.className = "moderate-btn";
    modBtn.onclick = () => {
      fetch("/api/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: parentComment._id,
          reply_index: index
        })
      }).then(() => fetchComments(articleURL));
    };

    const actionRow = document.createElement("div");
    actionRow.className = "action-row"; // class defined in CSS
    actionRow.appendChild(modBtn);
    replyEl.appendChild(actionRow);
  }

  return replyEl;
}


function postComment(articleURL, text) {
  fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ article_url: articleURL, text })
  })
    .then(res => {
      if (!res.ok) throw new Error("Post failed");
      return res.json();
    })
    .then(() => {
      fetchComments(articleURL);
      return fetchCommentCounts().then(fetchArticles);
    })
    .catch(() => alert("Could not post comment."));
}

// ---------- 5. Init ----------
if (typeof module !== "undefined") {
  module.exports = { initializeDate, fetchArticles, loadArticles, createCommentElement};
} else {
  initializeDate();
  fetchCommentCounts().then(fetchArticles);
}