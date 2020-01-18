var express = require('express');
var router = express.Router();
let UserValidator = require("../validator/UserValidator");
let db = require("../database/UserDb");
let hash = require("../validator/Bcrypt");
let auth = require('basic-auth');

router.get("/self", async (req, res, next)=>{
  let info = auth(req);
  let user = await db.login(info.name);
  user = user[0];
  console.log(info.pass+"------"+user.password)
  if(user.length == 0 || !hash.loginCompare(info.pass, user.password)){
    console.log("WRONG")
      res.status(401).send("Wrong username or password!");
      return;
  }
  next();
})


/* GET users listing. */
router.get('/self', async function(req, res, next) {
  let info = auth(req);
  let result = await db.findAll("email_address", info.name);
  res.status(200).send(result[0]);
});

router.put('/self', async function(req, res, next) {
  let put = req.body;
  let keys = Object.keys(put);
  let allowed = ["password", "first_name", "last_name"];
  let id ="1";
  if(keys.length >0 && keys.length > 3){
    res.status(400).send("Too many parameters");
    return;
  }
  for(key of keys){
    if(!allowed.includes(key)){
      res.status(400).send("Wrong parameters");
      return;
    }
  }
  if(keys.includes("password")){
    if(Array.isArray(UserValidator.passwordStrength(put.password))){
      res.status(400).send(UserValidator.passwordStrength(put.password));
      return;
    }
    put.password = hash.encrypt(put.password);
  }
  db.updateUser(id, put)

  res.status(204).send('Updated!');
});

router.post('/', async function(req, res, next) {
  let post = req.body;
  let result = await UserValidator.main(post);
    if(result != "Passed"){
      res.status(400).send("Bad Request \n"+result);
    return;
  }
  db.addUser(post);

  res.status(200).send("Added User");
});
module.exports = router;
