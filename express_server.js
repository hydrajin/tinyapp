const express = require("express");
const emailExists = require("./helpers.js");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

app.use(cookieParser());
app.use(cookieSession({
  name: "session",
  keys: ["pizzaisprettyawesome", "doot"],
  userID: null,
}));

const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

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

const urlsForUserId = (id) => {
  const result = {};
  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL];
    if (urlObj.userID === id) {
      result[shortURL] = urlObj;
    }
  }
  return result;
};

const user1Password = "123";
const user2Password = "abc";

let users = {
  "k2J3N3": {
    id: "k2J3N3",
    email: "a@a.com",
    password: bcrypt.hashSync(user2Password, 10)
    // password: "$2a$10$0pRZ8DkTzumYIJ509eph2ORQcAmxpG4VZY27HACDYg03nB3PoFlBS"
  },
  "aJ48lW": {
    id: "aJ48lW",
    email: "8@8.com",
    password: bcrypt.hashSync(user1Password, 10)
    // password: "$2a$10$Z1RSThjMjX83O8vKj3AR/uwLFkiuPRUqSh8tPvdUS9LEa0mypx5E."

  },
};

const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const { response } = require("express");
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/urls/new", (req, res) => {
  const userID = req.session["userID"];

  if (!userID) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const user = users[userID];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

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

app.get("/urls", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];
  if (!user) {
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const urls = urlsForUserId(userID);

  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {

  const userID = req.session["userID"];
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];

  if (!longURL) {
    return res.status(403).send(`This link does not exist`);
  } else {
    res.redirect(longURL);
  }
});

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

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userID = req.session["userID"];

  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const findUserByEmail = emailExists(email, users);
  console.log("Find User By Email:", findUserByEmail);

  if (!findUserByEmail) {
    return res.status(403).send("Account does not exist. <a href='/register'>Register</a>");
  }
  const passwordMatch = bcrypt.compareSync(password, findUserByEmail.password);
  if (findUserByEmail && !passwordMatch) {
    return res.status(403).send("Your login is incorrect. Please <a href='/login'>Try again</a>");
  }
  req.session.userID = findUserByEmail.id;
  return res.redirect("/urls");
});

app.get("/login", (req, res) => {
  const userID = req.session["userID"];
  if (userID !== null) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userID] };
    res.render("login", templateVars);
  }
});

app.post("/logout", (req, res) => {
  req.session["userID"] = null;
  return res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userID = req.session["userID"];
  if (userID !== null) {
    return res.redirect("/urls");
  } else {
    const templateVars = { user: users[userID] };
    res.render("registration", templateVars);
  }
});

app.post("/register", (req, res) => {
  const id = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password. <a href='/register'>Return to registration</a>");
  } else if (emailExists(email)) {
    return res.status(400).send("This email already exists! <a href='/login'>Return to Login</a>");
  }
  const newUser = { id, email, password: hashedPassword };
  req.session.userID = id;
  users = { ...users, [id]: newUser };
  return res.redirect("/urls");
});

app.get("/register.json", (req, res) => {
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
