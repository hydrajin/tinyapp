// Duplicate email checking function
const emailExists = (email, users) => {
  console.log("users", users);
  for (const key in users) {
    if (users[key].email === email) {
      return users[key];
    }
  }
  return undefined;
};

module.exports = emailExists;

