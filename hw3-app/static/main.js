// The date object in javascript gives you a number for day of the week (i.e. Sunday is 1, Monday is 2, etc.)and month (i.e. January is 1, February is 2, etc.), 
// ^ Learned this from this website that has the methods of the date object (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
// so we need these to convert them so they are usable for the NYT date by indexing the arrays from the value given by the date object
dotw = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


function initializeDate() {
  // Getting the element that I want to add text to, found in lecture 5 slides
  let dateArea = document.getElementById("dateArea");
  // Getting the date using the date object, referenced this website to interact with it 
  let date = new Date();

  // Getting all of the values needed to write the date on the webpage
  let currDotw = dotw[date.getDay()];
  let currDotm = date.getDate();  
  let currMonth = month[date.getMonth()];
  let currYear = date.getFullYear();

  // Setting the text content of the html element to the current date

  dateArea.textContent = currDotw + ", " + currMonth + " " + currDotm + ", " + currYear;;
}

// set up account button, opens sidebar and checks if mod or not
const accountBtn = document.getElementById("accountBtn");
const isModerator = accountBtn && accountBtn.dataset.moderator === "true";
if (accountBtn) {
  accountBtn.onclick = () => openAccountSidebar(accountBtn.dataset.email);
}


// fetch the articles from the backend and parse it, then ends 
// the list to loadArticles
function fetchArticles() {
  fetch("/api/articles")
    .then(res => res.json())
    .then(data => loadArticles(data.articles))
    .catch(err => console.error("Article load fail:", err));
}

//  store the number of comments per article
let commentCounts = {};

// get the total comment count for all the articles, puts them in the object
function fetchCommentCounts() {
  return fetch("/api/comments")
    .then(res => res.json())
    .then(data => { commentCounts = data.counts || {}; })
    .catch(err => console.error("Could not fetch comment counts:", err));
}

// load all the fetched articles, into seperate columns, complete w/ images
function loadArticles(articles) {
  // get the three columns in the article
  var columns = [
    document.querySelector('.centerColumn'),
    document.querySelector('.leftColumn'),
    document.querySelector('.rightColumn')
  ];

  // clear all articles
  for (var i = 0; i < columns.length; i++) {
    columns[i].innerHTML = '';
  }

  // loop through the articles
  for (var i = 0; i < articles.length; i++) {
    var article = articles[i];
    var selectedColumn = columns[i % 3];

    // make an article element and store the url for later
    var newArticle = document.createElement('article');
    newArticle.dataset.articleUrl = article.web_url;

    // add image, if valid
    if (article.multimedia.default.url) {
      var img = document.createElement('img');
      img.src = article.multimedia.default.url;
      img.alt = article.headline && article.headline.main ? article.headline.main : 'Article image';
      newArticle.appendChild(img);
    }

    // append the article headline, as a paragraph
    var title = document.createElement('p');
    title.className = 'articleHeader';
    title.textContent = article.headline.main;
    newArticle.appendChild(title);

    // add the article description as a paragraph below the headline
    var description = document.createElement('p');
    description.textContent = article.abstract;
    newArticle.appendChild(description);

    // make a button the toggle the comments section, on the side
    var btn = document.createElement('button');
    btn.className = 'comment-toggle-btn';

    // make a span showing the comment count for an article, starting at zer
    var span = document.createElement('span');
    span.className = 'comment-count';
    span.textContent = commentCounts[article.web_url] || 0;

    // add the comment emoji and comment count to the button, 
    // set the click to open the sidebar
    btn.innerHTML = '💬 ';
    btn.appendChild(span);
    btn.onclick = function(url, titleText) {
      return function() {
        openSidebar(url, titleText);
      };
    }(article.web_url, article.headline.main);

    // add the comment button to the article
    newArticle.appendChild(btn);
    // insert article in column
    selectedColumn.appendChild(newArticle);
  }
}


// variable to track the url of the article
let currentArticleURL = null;

// constants for the sidebar elements, like button, scroll, ect
const sidebar = document.getElementById("commentSidebar");
const closeBtn = document.getElementById("closeSidebarBtn");
const scrollArea = document.getElementById("commentsScrollArea");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentText");
const sidebarTitle = document.getElementById("sidebarArticleTitle");

// if the button exists, close comment sidebar by removing the open class when clicked
if (closeBtn) {
  closeBtn.addEventListener("click", function() {
    sidebar.classList.remove("open");
  });
}

// override the default form submission behavior, results in a page refresh
if (commentForm) {
  commentForm.addEventListener("submit", function(e) {
    e.preventDefault();
    postComment(currentArticleURL, commentInput.value.trim());
    commentInput.value = "";
  });
}

// open the comment sidebar, for an article, and load comments
function openSidebar(articleURL, title = "Comments") {
  // set current article url, update sidebar, and make bar visible w/ open
  currentArticleURL = articleURL;
  sidebarTitle.textContent = title;
  sidebar.classList.add("open");

  // clear scrollArea and add the heading
  scrollArea.innerHTML = "";

  // make a new h3 element for the heading in comment sidebar, and give id
  const heading = document.createElement("h3");
  heading.id = "commentHeading";

  // set the text of the heading to "Comments"
  heading.textContent = "Comments ";

  // make a new span element, to show the number of comments, starting at 0
  const span = document.createElement("span");
  span.id = "commentCount";
  span.textContent = "0";

  // append the comment count to the heading, add the 
  // heading to scroll area in sidebar
  heading.appendChild(span);
  scrollArea.appendChild(heading);

  // check if the comment form is real
  if (commentForm) {
    // if so, show and append the form to the sidebar
    commentForm.style.display = "block";
    scrollArea.appendChild(commentForm);
  }

  // call the function to load/display comments in the article sidebar
  fetchComments(articleURL);
}

// function to display the account sidebar, when account button is clicked
function openAccountSidebar(email) {
  // clear the article content, set sidebar title to users email
  currentArticleURL = null;
  sidebarTitle.textContent = email;
  // open sidebar
  sidebar.classList.add("open");

  // Clear previous content 
  scrollArea.innerHTML = "";

  // make a paragraph that shows the greeting message "Good afternoon"
  const greeting = document.createElement("p");
  greeting.textContent = "Good afternoon.";
  greeting.classList.add("sidebar-greeting");
  scrollArea.appendChild(greeting);

  // make a div that holds the logout button, put in class
  const bottomContainer = document.createElement("div");
  bottomContainer.classList.add("sidebar-bottom-container");

  // make a logout form, sends a GET request to /logout
  const form = document.createElement("form");
  form.action = "/logout";
  form.method = "get";

  // make a logout button for the form, class for styling
  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "Log out";
  button.classList.add("logout-button");

  // append the button to the form and put it in the sidebar
  form.appendChild(button);
  bottomContainer.appendChild(form);
  scrollArea.appendChild(bottomContainer);

  // if looking at the account sidebar, set the comment form to none
  if (commentForm) commentForm.style.display = "none";
}

// function to get all comments for an article and show them in the sidebar
function fetchComments(articleURL) {
  //  sent the get request to getch comments for a specific article
  fetch("/api/comments?url=" + articleURL)
  // parse the json response 
    .then(function(res) {
      return res.json();
    })
    // get the valid array
    .then(function(data) {
      const comments = data.comments || [];

      // Count all comments and their replies
      let totalCount = 0;
      for (let i = 0; i < comments.length; i++) {
        totalCount += 1;
        if (comments[i].replies) {
          totalCount += comments[i].replies.length;
        }
      }

      // update the comment count displayed in the sidebar w/ total comments and replies
      document.getElementById("commentCount").textContent = totalCount;

      // check if a list of comments is already there, and removes it
      const oldList = document.getElementById("commentList");
      if (oldList) {
        oldList.remove();
      }

      // make a new div for the list of comments and give it an id
      const list = document.createElement("div");
      list.id = "commentList";

      // loop through the comments and append each to comment list
      for (let i = 0; i < comments.length; i++) {
        const commentEl = createCommentElement(comments[i], articleURL);
        list.appendChild(commentEl);
      }

      // append newly made comment list to scroll area of sidebar
      scrollArea.appendChild(list);
    })
    // catches error if comment fetch fails
    .catch(function(err) {
      console.error("Failed to load comments:", err);
    });
}

// function to build and return a comment element, w/ author, text, ect
function createCommentElement(comment, articleURL) {
  // make a div container for a single comment and giv it a styling class 
  const item = document.createElement("div");
  item.className = "comment-item";

  // make a paragraph for the comment author and append to comment
  const author = document.createElement("p");
  author.className = "comment-author";
  author.textContent = "• " + (comment.user || "anonymous");
  item.appendChild(author);

  // make a paragraph for the comment text, and if it was removed replace the text
  const text = document.createElement("p");
  text.className = "comment-text";
  text.textContent = comment.moderated ? "COMMENT REMOVED BY MODERATOR!" : comment.text;
  item.appendChild(text);

  // make a div for the reply form and hide it, at first
  const replyForm = document.createElement("div");
  replyForm.className = "reply-form hidden";

  // make a text input for writing replies, w/ default text, appended to reply form
  const textarea = document.createElement("textarea");
  textarea.placeholder = "Write a reply…";
  replyForm.appendChild(textarea);

  // make a post button for submitting a reply, append to form
  const replyBtn = document.createElement("button");
  replyBtn.className = "submit-reply";
  replyBtn.textContent = "Post";
  replyForm.appendChild(replyBtn);

  // append the reply form to the main comment
  item.appendChild(replyForm);

  // make a div for replies under the comment, append to main comment
  const repliesDiv = document.createElement("div");
  repliesDiv.className = "replies";
  item.appendChild(repliesDiv);

  // insert the reply and remove buttons before the replies div
  item.insertBefore(createActionRow(comment, articleURL), repliesDiv);

  // loop through each reply, appending the element to the replies div
  const replies = comment.replies || [];
  for (let i = 0; i < replies.length; i++) {
    repliesDiv.appendChild(createReplyElement(replies[i], i, comment, articleURL));
  }

  // toggle the reply form when clicked
  item.querySelector(".reply-btn").onclick = () => {
    replyForm.classList.toggle("hidden");
  };

  // handle reply submissions, on click will read text input
  replyBtn.onclick = () => {
    const replyText = textarea.value.trim();
    // exit if no input
    if (!replyText) return;

    // send a post request to backend, w/ article url and parent coment id
    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_url: articleURL,
        text: replyText,
        parent_id: comment._id
      })
    })
    // after posting reply, refresh comments for article and update count
    .then(res => res.json())
    .then(() => {
      fetchComments(articleURL);
      return fetchCommentCounts().then(fetchArticles);
    });
  };

  // return the complete comment element, for inserting into DOM
  return item;
}

// function to make a row for reply and remove, the main actions
function createActionRow(comment, articleURL) {
  // make a div for holding buttons 
  const row = document.createElement("div");
  row.className = "action-row";

  // append a reply button to the row 
  const replyBtn = document.createElement("button");
  replyBtn.textContent = "Reply";
  replyBtn.className = "reply-btn";
  row.appendChild(replyBtn);

  // if the user is a moderator,
  if (isModerator) {
    // add the remove button
    const modBtn = document.createElement("button");
    modBtn.textContent = "Remove";
    // on click for remove button, sends mod request to backed
    modBtn.onclick = () => {
      fetch("/api/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: comment._id })
      })
      // refresh comment
      .then(() => fetchComments(articleURL));
    };
    // append the remove button to the action row
    row.appendChild(modBtn);
  }
  // return the action row
  return row;
}

// function to make a reply element with text, author, mod control
function createReplyElement(reply, index, parentComment, articleURL) {
  // make a div to contain the reply
  const replyEl = document.createElement("div");
  replyEl.className = "reply";

  // make a paragraph for the reply author, add arrow ↳ icon for reply
  const author = document.createElement("p");
  author.className = "comment-author";
  author.textContent = "↳ " + reply.user;
  replyEl.appendChild(author);

  // show reply text or a mod notice if the reply was removed
  const text = document.createElement("p");
  text.className = "comment-text";
  if (reply.moderated) {
    text.textContent = "COMMENT REMOVED BY MODERATOR!";
  } else {
    text.textContent = reply.text;
  }
  replyEl.appendChild(text);

  // If moderator,
  if (isModerator) {
    // make a button to remove the reply
    const modBtn = document.createElement("button");
    modBtn.className = "moderate-btn";
    modBtn.textContent = "Remove";

    // send mod request to mark the specific reply index as removed
    modBtn.onclick = () => {
      fetch("/api/comments/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_id: parentComment._id,
          reply_index: index
        })
      })
      // refresh comments to show removed reply 
      .then(() => fetchComments(articleURL));
    };

    // make a new action row div, but the mod button in it, 
    // and append to reply element
    const actionRow = document.createElement("div");
    actionRow.className = "action-row";
    actionRow.appendChild(modBtn);
    replyEl.appendChild(actionRow);
  }

  // return the constructed reply element
  return replyEl;
}

// function to post new comment to backend and refreshes comments and article list 
function postComment(articleURL, text) {
  // senda request to add new comment for article
  fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      article_url: articleURL,
      text: text
    })
  })
  // after posting the comment, refresh comment section for article 
    .then(() => {
      fetchComments(articleURL);
      return fetchCommentCounts();
    })
    // get the articles again to show change in ui
    .then(fetchArticles)          
    // error if the coment could not be posted
    .catch(() => {
      alert("Could not post comment.");
    });
}

// needed for jest; checks if a module exists 
if (typeof module !== "undefined") {
  module.exports = { initializeDate, fetchArticles, loadArticles, createCommentElement};
} else { // if not, run these as normal
  initializeDate();
  fetchCommentCounts().then(fetchArticles);
}