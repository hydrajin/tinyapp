const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  // registers a handler on the root path "/""
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// * Visit: localhost:8080/urls.json {"b2xVn2":"http://www.lighthouselabs.ca","9sm5xK":"http://www.google.com"}
// Use cURL to fetch the url: curl -i http://localhost:8080/hello

// * Will a variable that is created in one request be accessible in another?
/* a is not accessible in the other function/callback. The user will NOT see a set to 1 in /fetch.
In fact, a is not defined in this scope, and will result in a reference error when anyone visits that URL. */