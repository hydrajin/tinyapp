// Duplicate email checking function
const emailExists = (email, users) => {
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return undefined;
};

// Returns the urls only if userID equals id of logged in users
const urlsForUserId = (id, urlDatabase) => {
  const result = {};
  for (const shortURL in urlDatabase) {
    const urlObj = urlDatabase[shortURL];
    if (urlObj.userID === id) {
      result[shortURL] = urlObj;
    }
  }
  return result;
};

// Function to generate a random set of 6 characters for shortURL and userID use
const generateRandomString = () => {
  return Math.random().toString(36).substr(2, 6);
};

module.exports = { emailExists, urlsForUserId, generateRandomString };

