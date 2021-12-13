const { assert } = require('chai');

const emailExists = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('emailExists', function() {
  it('should return a user with valid email', function() {
    const user = emailExists("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
    // Write your assert statement here
  });
});
it('should return undefined if user email is invalid', function() {
  const user = emailExists("eight@8.com", testUsers);
  const expectedUserID = undefined;
  assert.equal(user, expectedUserID);
});