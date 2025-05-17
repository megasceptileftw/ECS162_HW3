// The date object in javascript gives you a number for day of the week (i.e. Sunday is 1, Monday is 2, etc.)and month (i.e. January is 1, February is 2, etc.), 
// ^ Learned this from this website that has the methods of the date object (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date)
// so we need these to convert them so they are usable for the NYT date by indexing the arrays from the value given by the date object
dotw = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Connect to login when the button is clicked
document.getElementById('loginBtn').addEventListener('click', () => {
  window.location.href = './login';
});


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

function fetchArticles() {
fetch("/api/key")
    .then (response => {
        if (!response.ok) {
            throw new Error('Failed to load apiKey');
        }
        return response.json()
    })
    .then(data => {
        const apiKey = data.apiKey;
        // nyt api article search info: https://developer.nytimes.com/docs/articlesearch-product/1/overview
        // location tags use this syntax: https://www.lucenetutorial.com/lucene-query-syntax.html 
        // the Sacramento (Calif) and Davis (Calif) tags where found by inspect element in relevent nyt articles
        const nyturl = `https://api.nytimes.com/svc/search/v2/articlesearch.json?fq=timesTag.location:"Sacramento (Calif)" OR timesTag.location:"Davis (Calif)"&api-key=` + apiKey;
        

        fetch(nyturl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network resp not ok');
                }
                return response.json();
            })
            .then (data => {
                console.log(data);
                // pass the articles into the function
                loadArticles(data.response.docs);
            })
            .catch(error => {
                console.error('Error: ', error);
            })
    })
    .catch(error => {
        console.error('Error: ', error);
    })
}


    function loadArticles(articles) {
      // components of the nyt json shown here:
      // https://developer.nytimes.com/docs/archive-product/1/types/Article


      // make a columns array to hold all the columns on the page
        var columns = [
            // returns the first element with the class leftColumn, and so on
            document.querySelector('.centerColumn'),
            document.querySelector('.leftColumn'),
            document.querySelector('.rightColumn')
          ];
          
          // loop through and clear old articles from all the columns using 
          // innerHTML, like shown in lecture 6
          for (var i = 0; i < columns.length; i++) {
            columns[i].innerHTML = '';
          }

          // loop through the articles from the nty api
          for (var i = 0; i < articles.length; i++) {

            // loop at the current article  
            var article = articles[i];
            // modulo 3 to determine what column that article should be in
            var selectedColumn = columns[i % 3];

            // creates a new element for the article
            var newArticle = document.createElement('article');


            // check if there is a default image url in the multimedia
            if (article.multimedia.default.url) {
                // make new image element 
                const img = document.createElement('img');
                // set image source to the url
                img.src = article.multimedia.default.url;
                // place at end of the article
                newArticle.appendChild(img); // Adds image before the title/description
              }


              
            // make a new element for the article title
            var title = document.createElement('p');
            // set the title to the article header class from index.html
            title.className = 'articleHeader';
            // set the text content to the main headline
            title.textContent = article.headline.main;
            // places the title at the end of the article element
            newArticle.appendChild(title);

            // make a new paragraph to hold the article description
            var description = document.createElement('p');
            // set the description text to the abstract from nyt
            description.textContent = article.abstract;
            // places the paragrpah at the end of the article element
            newArticle.appendChild(description);
            // places the article at the end of the column element
            selectedColumn.appendChild(newArticle);
          }
      }

      // nneded for jest; checks if a module exists 
      if (typeof module !== 'undefined') {
        module.exports = {
          loadArticles,
          initializeDate,
          fetchArticles
        };
      } else { // if not, run these as normal
        initializeDate(); 
        fetchArticles();
      }