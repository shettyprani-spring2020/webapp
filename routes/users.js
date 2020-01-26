var express = require("express");
var router = express.Router();
let UserValidator = require("../validator/UserValidator");
let dbUser = require("../database/UserDb");
let hash = require("../validator/Bcrypt");
let auth = require("basic-auth");

// Check all self endpoints for authentication
router.all("/self", async (req, res, next) => {
  let info = auth(req);
  if (info == undefined) {
    return res.status(401).send("No authorization");
  } else {
    let user = await dbUser.login(info.name);
    user = user[0];
    if (user == undefined) {
      return res.status(401).send("No authorization");
    }
    let pass = info.pass;
    if (user.length == 0 || !hash.loginCompare(pass, user.password)) {
      return res.status(401).send("Wrong username or password!");
    }
    next();
  }
});

/* GET users listing. */
router.get("/self", async function(req, res, next) {
  let info = auth(req);
  let result = await dbUser.findAll("email_address", info.name);
  result = result[0];
  delete result["password"];
  res.status(200).send(result);
});

// Put end point to create new user
// Can only PUT if authenticated and all fields provided
router.put("/self", async function(req, res, next) {
  let put = req.body;
  let keys = Object.keys(put);
  let allowed = ["password", "first_name", "last_name", "email_address"];
  let info = auth(req);
  let name = info.name;
  if (UserValidator.numOfKeys(put, 4)) {
    res.status(400).send("Bad Request");
    return;
  }
  if (UserValidator.missingKeys(put, allowed)) {
    return res.status(400).send("Bad Request!");
  }
  if (info.name != put["email_address"]) {
    return res.status(400).send("Bad Request!");
  } else {
    delete put["email_address"];
  }
  if (keys.includes("password")) {
    if (Array.isArray(UserValidator.passwordStrength(put.password))) {
      res.status(400).send(UserValidator.passwordStrength(put.password));
      return;
    }
    put.password = hash.encrypt(put.password);
  }
  dbUser.updateUser(name, put);
  res.status(204).send();
});

// post end point to create new user
router.post("/", async function(req, res, next) {
  let post = req.body;
  let result = await UserValidator.main(post);
  if (result != "Passed") {
    res.status(400).send("Bad Request \n" + result);
    return;
  }
  dbUser.addUser(post, res).then(user => {
    return res.status(201).send(user);
  });
});
module.exports = router;
