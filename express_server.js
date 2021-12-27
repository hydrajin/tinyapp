const express = require("express");
const { restart } = require("nodemon");
const { response } = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
const app = express();
const PORT = 8080;

// Functions in the helper.js file
const { emailExists, urlsForUserId, generateRandomString } = require("./helpers.js");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// For setting cookies upon login/registration
app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["pizzaisprettyawesome", "doot"],
  userID: null,
}));

// For password encrypting/salting
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

// url "Database"
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  sgq3y6: {
    longURL: "https://www.google.ca",
    userID: "k2J3N3"
  }
};

// Used to test/debug login/registration/etc
const user1Password = "123";
const user2Password = "abc";

// User "Database"
let users = {
  "k2J3N3": {
    id: "k2J3N3",
    email: "a@a.com",
    password: bcrypt.hashSync(user2Password, salt)
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "8@8.com",
    password: bcrypt.hashSync(user1Password, salt)
  },
};

// Test/Secret Url
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello World! This Is <b>TinyApp</b> </body></html>\n");
});

//!-----------------------------------------------------/------------------------------------------------------------
app.get("/", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];

  if (!user) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  res.redirect("/urls");
});

//!-----------------------------------------------------/U/:SHORTURL------------------------------------------------
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL || null;
  const validLink = urlDatabase[shortURL];

  if (!validLink) {
    return res.status(403).send(`This link does not exist! <a href='/urls'>Return to My URLS</a>`);
  } else {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
});

//!-----------------------------------------------------/URLS/NEW---------------------------------------------------
app.get("/urls/new", (req, res) => {
  const userID = req.session["userID"];

  if (!userID) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const user = users[userID];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

//!-----------------------------------------------------/URLS/:SHORTURL---------------------------------------------
//----------GET
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["userID"];
  const shortURL = req.params.shortURL;
  const urlData = urlDatabase[shortURL];

  if (!urlData) {
    return res.send(`Could not find URL <a href='/urls'> Return to My URLS <a/>`);
  }
  if (userID === urlData.userID) {
    const templateVars = { shortURL, longURL: urlData["longURL"], user: users[userID] };
    return res.render("urls_show", templateVars);
  }
  return res.send(`Access denied! <a href='/urls'> Return to My URLS <a/>`);
});
//----------POST
app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["userID"];

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect("/urls");
});

//!-----------------------------------------------------/URLS------------------------------------------------------
//----------GET
app.get("/urls", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];

  if (!user) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const urls = urlsForUserId(userID, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

//----------POST
app.post("/urls", (req, res) => {
  const userID = req.session["userID"];
  const shortURL = generateRandomString();
  const user = users[userID];

  if (!user) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

// Used to see if urls are properly being created/deleted
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//!-----------------------------------------------------DELETE SHORTURL----------------------------------------------
app.post("/urls/:shortURL/delete", (req, res) => {
  const userID = req.session["userID"];
  const shortURL = req.params.shortURL;
  const shortUrlID = urlDatabase[shortURL]["userID"];

  if (userID === shortUrlID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
  }
  return res.status("403").send("You can't delete someone elses shortURL! <a href='/urls'>Return to My URLS</a>");
});

//!-----------------------------------------------------LOGIN--------------------------------------------------------
//----------GET
app.get("/login", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];

  if (!user) {
    const templateVars = { user: users[userID] };
    res.render("login", templateVars);
  } else {
    return res.redirect("/urls");
  }
});
//----------POST
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const findUserByEmail = emailExists(email, users);

  if (!findUserByEmail) {
    return res.status(403).send("Account does not exist. Please <a href='/register'>Register</a>");
  }
  const passwordMatch = bcrypt.compareSync(password, findUserByEmail.password);
  if (findUserByEmail && !passwordMatch) {
    return res.status(403).send("Your login is incorrect. Please <a href='/login'>Try again</a>");
  }
  req.session.userID = findUserByEmail.id;
  return res.redirect("/urls");
});

//!-----------------------------------------------------LOGOUT--------------------------------------------------------
app.post("/logout", (req, res) => {
  res.clearCookie("session.sig");
  res.clearCookie("session");
  return res.redirect("/urls");
});

//!-----------------------------------------------------REGISTER------------------------------------------------------
//----------GET
app.get("/register", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];

  if (!user) {
    const templateVars = { user: users[userID] };
    res.render("registration", templateVars);
  } else {
    return res.redirect("/urls");
  }
});
//----------POST
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const findUserByEmail = emailExists(email, users);
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, salt);

  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password. <a href='/register'>Return to registration</a>");
  } else if (findUserByEmail) {
    return res.status(400).send("This email already exists! <a href='/login'>Return to Login</a>");
  }
  const newUser = { id, email, password: hashedPassword };
  req.session.userID = id;
  users = { ...users, [id]: newUser };
  return res.redirect("/urls");
});

// Used to see if accounts are being properly registered
app.get("/register.json", (req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Suli's TinyApp listening on port ${PORT}!`);
});
