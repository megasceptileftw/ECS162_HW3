/**
 * @jest-environment jsdom
 */

const { loadArticles, initializeDate, fetchArticles } = require('../static/main.js');

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



// test loadArticles() UI logic
test("loadArticles puts articles into columns", function() {
  // make a mock html like the real website
  document.body.innerHTML =
    '<div class="centerColumn"></div>' +
    '<div class="leftColumn"></div>' +
    '<div class="rightColumn"></div>';

  // loop through and make fake articles
  var fakeArticles = [];
  for (var i = 0; i < 3; i++) {
    fakeArticles.push({
      // each will have a title,
      headline: { main: "Headline " + i },
      // a description,
      abstract: "Abstract " + i,
      // and an image
      multimedia: {
        "default": { url: "https://example.com/img" + i + ".jpg" }
      }
    });
  }

  // run loadArticles wit hthe fake articles
  loadArticles(fakeArticles);

  // check if there is actually 3 article elements
  var allArticles = document.querySelectorAll('article');
  // use tobe to check if equal 
  expect(allArticles.length).toBe(3);
  // check if placement is correct in correct column
  // use toMatch to see if it matches the string
  // https://jestjs.io/docs/expect#tomatchregexp--string
  expect(document.querySelector('.centerColumn').textContent).toMatch("Headline 0");
  expect(document.querySelector('.leftColumn').textContent).toMatch("Headline 1");
  expect(document.querySelector('.rightColumn').textContent).toMatch("Headline 2");
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


// test the fetchArticles function
test("fetchArticles calls /api/key only", async () => {
  // make a mock html like the real website
  document.body.innerHTML = `
    <div class="centerColumn"></div>
    <div class="leftColumn"></div>
    <div class="rightColumn"></div>
  `;

  // call the fetchArticles function
  await fetchArticles();
  // ensure the mock function was called one time
  // https://jestjs.io/docs/expect#tohavebeencalledtimesnumber
  expect(global.fetch).toHaveBeenCalledTimes(1);
  // use toMatch to see if fetch was called with a specific URL 
  expect(global.fetch.mock.calls[0][0]).toMatch('/api/key');
});
