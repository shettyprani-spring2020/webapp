var express = require('express');
var router = express.Router();
let UserValidator = require("../validator/UserValidator");
let db = require("../database/UserDb");
let hash = require("../validator/Bcrypt");
let auth = require('basic-auth');

router.all("/self", async (req, res, next)=>{
  let info = auth(req);
  if(info == undefined){
    return res.status(401).send("No authorization");
  }else{
  let user = await db.login(info.name);
  user = user[0];
  let pass = info.pass;
  if((user.length == 0 || !hash.loginCompare(pass, user.password))){
    return res.status(401).send("Wrong username or password!");
  }
  let existing_token = req.headers['x-access-token'] || req.headers['authorization'];
  console.log(existing_token)
  next();
}
});


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
  let info = auth(req);
  let name = info.name;
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
  db.updateUser(name, put)

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
