/* eslint-disable camelcase */
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

app.use(cookieParser()); // I didn't add this after declaring cookie parser...

app.set("view engine", "ejs");
// set ejs as the view engine

// For now place it in the out-most (global) scope
// eslint wanted a named function?
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
  // Found on stackoverflow
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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

// Only specific user can see their created URLS
// I need the ids/keys of the user and to return an object
const urlsForUserId = (id) => {
  const result = {};
  // Note the good naming style (Gary J)
  for (const shortURL in urlDatabase) {
    // look it up using the key!
    const urlObj = urlDatabase[shortURL];
    if (urlObj.userID === id) {
      result[shortURL] = urlObj;
    }
  }
  return result;
};


// Create a users Object (store user data)
let users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "8@8.com",
    password: "123"
  },
  "k2J3N3": {
    id: "k2J3N3",
    email: "user2@example.com",
    password: "123"
  }


};
// users.push({email: newEmail, password: newPassword});
// console.log('users', users);
// res.redirect('/');
// {
//   "userRandomID": {
//     id: "userRandomID",
//     email: "user@example.com",
//     password: "purple-monkey-dinosaur"
//   },
//   "user2RandomID": {
//     id: "user2RandomID",
//     email: "user2@example.com",
//     password: "dishwasher-funk"
//   }
// }


// MIDDLEWARE
// Needs to come BEFORE all our routes.
const bodyParser = require("body-parser");
const { restart } = require("nodemon");
const { response } = require("express");
app.use(bodyParser.urlencoded({ extended: true }));
// Converts the req. body from a buffer into a string (which we can read)
// data in the input field wil be available to us in the req.body.longURL variable, which we can store in our urlDatabase object (Later)

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

// Need 2 new routes: GET route to render urls_new.ejs (presents form to user)
// Redirect if someone is not logged in and trying to acess /urls/new
app.get("/urls/new", (req, res) => {
  const userID = req.cookies["user_id"];
  // const email = req.body.email;
  if (userID === undefined) {
    // .set('Content-Type', 'text/html').
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  // const user_id = req.cookies["user_id"];
  const user = users[userID];
  const templateVars = { user }; //! urls: urlDatabase,
  res.render("urls_new", templateVars);
});
// the order of the route definition matters! (Get /urls/new needs to be defined before GET /urls/:id)
// A good rule of thumb to follow: Routes should be ordered from MOST specific to LEAST specific
// HAD to add a template vars to this route in order to get code/username working!!


app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const user = users[userID];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];
  const shortUrlID = urlDatabase[shortURL]["userID"];
  // urlDatabase[shortURL] = {longURL: req.body.longURL, user };

  //Check if urserID equals shortURLID
  if (userID === shortUrlID) {
    const templateVars = { shortURL, longURL, user };
    res.render("urls_show", templateVars);
  }
  return res.send(`Access denied! <a href='/urls'> Return to My URLS <a/>`);
});

// add a new route handler for "/urls" and use res.render() to pass the URL data to our template
app.get("/urls", (req, res) => {
  const user_id = req.cookies["user_id"];
  const user = users[user_id];
  if (!user) {
    //.set('Content-Type', 'text/html')
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const urls = urlsForUserId(user_id);

  // only need key since values have same key name...
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});
// templateVars object contains the object urlDatabase? under the key urls
// We then pass the templateVars object to the template calls urls_index


// Need a POST request to submit new urls/form data
// Update the server so that shortURL-longURL key-value pairs are saved to the urlDatabase when it recieves a POST request to /urls
app.post("/urls", (req, res) => {
  // console.log(req.body);  // Log the POST request body to the console
  const userID = req.cookies["user_id"];
  // const user = users[user_id];
  //if(user_id !== null || user_id !== undefined)
  if (userID === undefined) {
    // res.status(403).set('Content-Type', 'text/html').send("Your login is incorrect Please <a href='/login'>Try again</a>");
  }
  // Generate the new shortURL
  let shortURL = generateRandomString(); // makes the random short URL
  // urlDatabase[shortURL] = req.body.longURL; // readable string from bodyParser that is stored in our database
  // Respond with a redirect to /urls/:shortURL (shortURL is the string we created)
  // const longURL = req.body.longURL;
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});
// Sends an OK message when submitted, { longURL: 'www.pokemon.com'} in terminal

app.get("/u/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL]["longURL"];

  if (!longURL) {
    return res.status(403).send(`This link does not exist`);
    // TODO HERE: Needed to put longUrl in brackets with quotes!? BUT WHY?!
    // ! www.google.com vs http://www.google.com error
  } else {
    res.redirect(longURL);
  }
});


// Add a POST route that removes a URL resource: POST /urls/:shortURL/delete
app.post("/urls/:shortURL/delete", (req, res) => {
  // ! I was missing the "/" before urls! make note for next time!
  // Nally lecture (1:31:43)  const userID = req.cookies["user_id"];
  const userID = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  const shortUrlID = urlDatabase[shortURL]["userID"];

  if (userID === shortUrlID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  }
  return res.status("403").send("You can't delete someone elses shortURL! <a href='/urls'>Return to My URLS</a>");
});

// Add a POST route to edit already existing URL resource (to an already short URL?)
app.post("/urls/:shortURL", (req, res) => {
  // const shortURL = req.params.shortURL;
  // // console.log(urlDatabase[shortURL]);
  // urlDatabase[shortURL] = req.body.longURL;
  // Changes existing shortURL to a NEW longURL
  const shortURL = req.params.shortURL;
  // const longURL = req.body.longURL;
  const userID = req.cookies["user_id"];
  // const user = users[user_id];
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect("/urls");
});

// Add a POST route to a login page
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  let userExists = false;


  for (const user of Object.values(users)) {
    // console.log(user);
    // console.log(user.password);
    if (user.email === email) {
      if (user.password === password) {
        userExists = true;
        res.cookie("user_id", user.id);
      } else {
        //! ERROR PAGE IS HTML (res.set...)
        // res.set('Content-Type', 'text/html');
        return res.status(403).set('Content-Type', 'text/html').send("Your login is incorrect Please <a href='/login'>Try again</a>");
      }
    }
  }

  // res.send("SUCESSFULLY LOGGED IN!");
  // res.render("login");
  if (userExists) {
    res.redirect("/urls");
  } else {
    return res.status(403).send("Account does not exist <a href='/register'>Register</a>");
  }
});

app.get("/login", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (user_id !== undefined) {
    // const user = users[user_id];
    // const templateVars = { urls: urlDatabase, user };
    res.redirect("/urls");
  } else {
    const templateVars = { user: null };
    res.render("login", templateVars);
  }
});


// Add a POST route to logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); // changed to "user_id"
  return res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const user_id = req.cookies["user_id"];
  if (user_id !== undefined) {
    // const user = users[user_id];
    // const templateVars = { urls: urlDatabase, user };
    return res.redirect("/urls");
  } else {
    const templateVars = { user: null }; // null! nothing in there yet
    res.render("registration", templateVars);
  }
});

// Make a post request!!
app.post("/register", (req, res) => {
  const id = generateRandomString();
  // const user_id = req.cookies["user_id"];
  const email = req.body.email;
  const password = req.body.password;

  // users[id] = newUser;
  // Prevent Registration with blank email/password
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password <a href='/login'>Return to Login</a>");
  } else if (emailExists(email)) {
    return res.status(400).send("This email already exists <a href='/login'>Return to Login</a>");
  }
  // Set a user_id cookie
  res.cookie("user_id", id);
  // redirect to /register.json to check new user creation
  // res.redirect("/register.json");
  res.redirect('/urls');

  users[id] = { id, email, password };
  // Have to keep this below the conditionals
});

// Duplicate email checking function
const emailExists = (email) => {
  for (const key in users) {
    if (users[key].email === email) {
      return true;
    }
  }
  return false;
};

// Check users database to see account registration
app.get("/register.json", (req, res) => {
  res.json(users);
});

//Should be at the bottom?
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// * Visit: localhost:8080/urls.json {"b2xVn2":"http://www.lighthouselabs.ca","9sm5xK":"http://www.google.com"}
// Use cURL to fetch the url: curl -i http://localhost:8080/hello

// * Will a variable that is created in one request be accessible in another?
/* a is not accessible in the other function/callback. The user will NOT see a set to 1 in /fetch.
In fact, a is not defined in this scope, and will result in a reference error when anyone visits that URL. */

// * Express convention of using views (EJS automatically knows to look inside the views directory for any template files with .ejs extension)
/* When sending variables to an EJS template, we need to send them inside an object, even if we are only sending one variable.
This is so we can use the key of that variable (in the above case the key is urls) to access the data within our template. */