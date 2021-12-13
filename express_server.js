/* eslint-disable camelcase */
const express = require("express");
const emailExists = require("./helpers.js");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
// set ejs as the view engine

// Cookie Middleware
const cookieParser = require("cookie-parser");
const cookieSession = require("cookie-session");
// Storing passwords securely
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
// console.log(salt);
// const password = "purple-monkey-dinosaur"; // found in the req.params object


// COOKIES
app.use(cookieParser()); // I didn't add this after declaring cookie parser...
app.use(cookieSession({
  name: "session",
  keys: ["pizzaisprettyawesome", "doot"],
  userID: null, // ! undefined??
}));

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

const user1Password = "123";
const user2Password = "abc";


// Create a users Object (store user data)
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
    // password: bcrypt.hashSync(user1Password, 10)
    password: "$2a$10$Z1RSThjMjX83O8vKj3AR/uwLFkiuPRUqSh8tPvdUS9LEa0mypx5E."

  },
};
// console.log(users);
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
  const userID = req.session["userID"];
  // const email = req.body.email;
  if (!userID) { //userID === undefined || userID === null
    // .set('Content-Type', 'text/html').
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  // const userID = req.session["userID"];
  const user = users[userID];
  const templateVars = { user }; //! urls: urlDatabase,
  res.render("urls_new", templateVars);
});
// the order of the route definition matters! (Get /urls/new needs to be defined before GET /urls/:id)
// A good rule of thumb to follow: Routes should be ordered from MOST specific to LEAST specific
// HAD to add a template vars to this route in order to get code/username working!!


app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session["userID"];
  const shortURL = req.params.shortURL;
  const urlData = urlDatabase[shortURL];
  // console.log(urlData);
  // urlDatabase[shortURL] = {longURL: req.body.longURL, user };

  if (!urlData) {
    return res.send(`Could not find URL <a href='/urls'> Return to My URLS <a/>`);
  }
  if (userID === urlData.userID) {
    const templateVars = { shortURL, longURL: urlData["longURL"], user: users[userID] };
    return res.render("urls_show", templateVars);
  }
  return res.send(`Access denied! <a href='/urls'> Return to My URLS <a/>`);


  //Check if urserID equals shortURLID
  // if (userID === shortUrlID) {
  //   const templateVars = { shortURL, longURL, user };
  //   return res.render("urls_show", templateVars);
  // }
  // return res.send(`Access denied! <a href='/urls'> Return to My URLS <a/>`);
});

// add a new route handler for "/urls" and use res.render() to pass the URL data to our template
app.get("/urls", (req, res) => {
  const userID = req.session["userID"];
  const user = users[userID];
  if (!user) {
    //.set('Content-Type', 'text/html')
    return res.status(403).send(`Please <a href='/login'> login<a/> or  <a href='/register'> register</a>`);
  }
  const urls = urlsForUserId(userID);

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
  const userID = req.session["userID"];
  // const user = users[userID];
  //if(userID !== null || userID !== undefined)
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
  // const userID = req.session["userID"];
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
  // Nally lecture (1:31:43)  const userID = req.session["userID"];
  const userID = req.session["userID"];
  const shortURL = req.params.shortURL;
  const shortUrlID = urlDatabase[shortURL]["userID"];

  if (userID === shortUrlID) {
    delete urlDatabase[shortURL];
    return res.redirect("/urls");
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
  const userID = req.session["userID"];
  // const user = users[userID];
  urlDatabase[shortURL] = { longURL: req.body.longURL, userID };
  res.redirect("/urls");
});

// Add a POST route to a login page
app.post("/login", (req, res) => {
  // const email = req.body.email;
  // console.log(email);
  // const password = req.body.password;
  const { email, password } = req.body;
  // const hashedPassword = bcrypt.hashSync(password, 10);
  // console.log(bcrypt.compareSync("123", hashedPassword)); // returns true
  // let userExists = false;
  const findUserByEmail = emailExists(email, users);
  console.log("Find User By Email:", findUserByEmail);
  // console.log("Password Match", passwordMatch);
  // return res.end("TEST123");

  if (!findUserByEmail) {
    return res.status(403).send("Account does not exist. <a href='/register'>Register</a>");
  }
  const passwordMatch = bcrypt.compareSync(password, findUserByEmail.password);
  if (findUserByEmail && !passwordMatch) { // if user exists but password is incorrect!
    return res.status(403).send("Your login is incorrect. Please <a href='/login'>Try again</a>");
  }
  req.session.userID = findUserByEmail.id;
  return res.redirect("/urls");

  // ! NOT REACHING THIS CODE!!!
  // for (let user in users) {
  //   const catchPassword = bcrypt.hashSync(password, 10);
  //   console.log("Catch:", catchPassword);
  //   console.log("hased pass synch", bcrypt.compareSync(password, users[user].password));
  //   if (findUserByEmail && bcrypt.compareSync(password, users[user].password)) {
  //     console.log("User Exists", users[user]);
  //     return res.redirect("/urls");
  //     // return res.end("Suliman");
  //   } else {
  //     return res.status(403).set('Content-Type', 'text/html').send("Your login is incorrect. Please <a href='/login'>Try again</a>");
  //   }
  // }
  // return res.end("Total Failure");


  // for (const user of Object.values(users)) {
  //   // console.log(user);
  //   // console.log(user.password);
  //   if (user.email === email) {
  //     // user.password === password


  //     const passwordMatching = bcrypt.compareSync(password, user.password);
  //     console.log("Password Match: ",passwordMatching);
  //     if (passwordMatching) {

  //       userExists = true;
  //       // const userID = req.session["userID"];
  //       // res.cookie("userID", user.id);
  //       req.session.userID = user_id;
  //       return res.redirect("/urls");
  //     } else {
  //       return res.status(403).set('Content-Type', 'text/html').send("Your login is incorrect. Please <a href='/login'>Try again</a>");
  //     }

  //   }
  //   return res.status(403).send("Account does not exist. <a href='/register'>Register</a>");
  // }
  // res.send("SUCESSFULLY LOGGED IN!");
  // res.render("login");
  // if (userExists) {
  //   // return true;
  //   res.redirect("/urls");
  // } else {
  //   return res.status(403).send("Account does not exist. <a href='/register'>Register</a>");
  // }
});

app.get("/login", (req, res) => {
  const userID = req.session["userID"];
  if (userID !== null) {
    // const user = users[userID];
    // const templateVars = { urls: urlDatabase, user };
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[userID] }; // ! Changed! used to be null!
    res.render("login", templateVars);
  }
});


// Add a POST route to logout
app.post("/logout", (req, res) => {
  // res.clearCookie("userID"); // changed to "userID"
  // res.clearCookie("session.sig");
  // res.clearCookie("session");
  req.session["userID"] = null;
  return res.redirect("/urls");
});

app.get("/register", (req, res) => {
  const userID = req.session["userID"];
  if (userID !== null) {
    // const user = users[userID];
    // const templateVars = { urls: urlDatabase, user };
    return res.redirect("/urls");
  } else {
    const templateVars = { user: users[userID] };  //! (Changed!) null! nothing in there yet
    res.render("registration", templateVars);
  }
});

// Make a post request!!
app.post("/register", (req, res) => {
  const id = generateRandomString();
  // const userID = req.session["userID"];
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // users[id] = newUser;
  // Prevent Registration with blank email/password
  if (!email || !password) {
    return res.status(400).send("Please enter a valid email and password. <a href='/register'>Return to registration</a>");
  } else if (emailExists(email)) {
    return res.status(400).send("This email already exists! <a href='/login'>Return to Login</a>");
  }

  const newUser = { id, email, password: hashedPassword };
  req.session.userID = id;
  users = { ...users, [id]: newUser }; // making a copy of the objects
  return res.redirect("/urls");

  // for (const user of Object.values(users)) {
  //   // Set a userID cookie
  //   // res.cookie("userID", user.id);
  //   req.session.userID = user.id;
  // }
  // // req.cookie.id = id;
  // // redirect to /register.json to check new user creation
  // // res.redirect("/register.json");
  // res.redirect('/urls');

  // users[id] = { id, email, password: hashedPassword };
  // Have to keep this below the conditionals
});

// // Duplicate email checking function
// const emailExists = (email) => {
//   for (const key in users) {
//     if (users[key].email === email) {
//       return users[key];
//     }
//   }
//   return false;
// };

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