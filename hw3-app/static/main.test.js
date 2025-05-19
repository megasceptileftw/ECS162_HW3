/**
 * @jest-environment jsdom
 */

const { loadArticles, initializeDate, fetchArticles, createCommentElement } = require('../static/main.js');

// test date formatting and display
test("initializeDate sets correct date", function() {
  // make a mock html element and call the function
  document.body.innerHTML = '<p id="dateArea"></p>';
  initializeDate();

  // find the element 
  var dateElement = document.getElementById("dateArea");
  // expect used compare results to code, ensure it's not null
  // https://jestjs.io/docs/expect#expectvalue
  expect(dateElement).not.toBe(null);

  // get today's date 
  var date = new Date();
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var months = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];

  // make the expected result
  var expected = days[date.getDay()] + ", " + months[date.getMonth()] + " " +
  date.getDate() + ", " + date.getFullYear();

  // use tobe to check if they are equal 
  // https://jestjs.io/docs/expect#tobevalue
  expect(dateElement.textContent).toBe(expected);
});

test("making sure that createCommentElement works + hiding and unhiding of reply form", async () => {
  // creating an example comment
  const comment = {
    _id: "1",
    user: "user@example.com",
    text: "example",
    moderated: false,
    replies: []
  };

  // creating article url for the createCommentElement function
  const articleURL = "/test-url";

  // creating a comment using createCommentElement
  const testComment = createCommentElement(comment, articleURL);

  // expecting the test comment to have the comment-item class
  expect(testComment.classList.contains("comment-item")).toBe(true);

  // expecting the author of the comment to not be null and to be the correct user
  const author = testComment.querySelector(".comment-author");
  expect(author).not.toBeNull();
  expect(author.textContent).toBe("• user@example.com");

  //expecting the comment text to be correct and for it not to be null
  const commentText = testComment.querySelector(".comment-text");
  expect(commentText).not.toBeNull();
  expect(commentText.textContent).toBe("example");

  // expecting the reply form and reply button to not be null
  const toggleReplyBtn = testComment.querySelector(".reply-btn");
  const replyForm = testComment.querySelector(".reply-form");
  expect(toggleReplyBtn).not.toBeNull();
  expect(replyForm).not.toBeNull();

  // initially the reply form is supposed to be hidden
  expect(replyForm.classList.contains("hidden")).toBe(true);

  // when the reply button is clicked, the reply form is supposed to be unhidden
  toggleReplyBtn.click();
  expect(replyForm.classList.contains("hidden")).toBe(false);

  // when the reply button is clicked again it is supposed to be hidden again
  toggleReplyBtn.click();
  expect(replyForm.classList.contains("hidden")).toBe(true);

});


// test nyt article structure 
test("nyt article expected fields", function() {
  // make an object similar to an actual article in the nyt api
  var article = {
    headline: { main: "Example" },
    abstract: "Summary",
    web_url: "https://www.nytimes.com/article",
    multimedia: {
      "default": { url: "https://nytimes.com/image.jpg" }
    }
  };

  // ensure the headline and main sections exist
  expect(article.headline && article.headline.main).not.toBe(undefined);
  // ensure the summary exists 
  // use tobe to check if equal 
  expect(typeof article.abstract).toBe("string");
});



// make a mock function mock fetch and test API key fetch
// https://jestjs.io/docs/jest-object#jestfnimplementation
global.fetch = jest.fn()
// mock function that sets behavior for a single call
// seen here: https://jestjs.io/docs/mock-function-api#mockfnmockimplementationoncefn
  .mockImplementationOnce(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ apiKey: "test-key" })
  }))
  // same mock function, for a diferent call
  .mockImplementationOnce(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ response: { docs: [] } })
  }));
