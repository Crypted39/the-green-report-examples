const { Given, When, Then, Before } = require("@cucumber/cucumber");
const User = require("../../src/models/User");
const assert = require("assert");
const { transformUserTable } = require("./table_transformations");

// In-memory storage for testing
let users = [];
let currentUser = null;

Before(function () {
  users = [];
  currentUser = null;
});

// Using custom parameter types in step definitions
Given("a user with email {email} and role {user_role}", function (email, role) {
  const user = new User({ email, role });
  users.push(user);
  this.lastCreatedUser = user;
});

Given(
  "a {user_role} user named {string} with email {email}",
  function (role, name, email) {
    const user = new User({ email, role, name });
    users.push(user);
    this.lastCreatedUser = user;
  }
);

When("I login as {email}", function (email) {
  currentUser = users.find((user) => user.email.value === email.value);
  if (!currentUser) {
    throw new Error(`No user found with email: ${email.value}`);
  }
});

Then("the user should have {user_role} privileges", function (expectedRole) {
  assert.strictEqual(currentUser.role.value, expectedRole.value);
});

Then("the user should be able to {string}", function (permission) {
  assert(
    currentUser.hasPermission(permission),
    `User with role ${currentUser.role.value} should have ${permission} permission`
  );
});

Given("I have {money} in my account", function (amount) {
  this.accountBalance = amount;
});

Then("my balance should be {money}", function (expectedAmount) {
  assert.strictEqual(this.accountBalance.cents, expectedAmount.cents);
});

Given("today is {date}", function (date) {
  this.currentDate = date;
});

Then("the date should be a weekend", function () {
  assert(this.currentDate.isWeekend(), "Expected date to be a weekend");
});

Given("the following users exist:", function (dataTable) {
  const userList = transformUserTable(dataTable);
  users.push(...userList);
  this.users = users;
});

Then("I should have {int} user(s) created", function (expectedUserCount) {
  assert.strictEqual(users.length, expectedUserCount);
});
