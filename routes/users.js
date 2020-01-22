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
  result = result[0];
  delete result["password"];
  res.status(200).send(result);
});

router.put('/self', async function(req, res, next) {
  let put = req.body;
  let keys = Object.keys(put);
  let allowed = ["password", "first_name", "last_name", "email_address"];
  let info = auth(req);
  let name = info.name;
  if(keys.length != 4){
    res.status(400).send("Bad Request");
    return;
  }
  
  for(key of keys){
    if(!allowed.includes(key)){
      res.status(400).send("Wrong parameters");
      return;
    }
  }
  if(info.name != put["email_address"]){
    return res.status(400).send("Bad Request!")
  }else{
    delete put["email_address"]
  }
  if(keys.includes("password")){
    if(Array.isArray(UserValidator.passwordStrength(put.password))){
      res.status(400).send(UserValidator.passwordStrength(put.password));
      return;
    }
    put.password = hash.encrypt(put.password);
  }
  db.updateUser(name, put);
  res.status(204).send();
});

router.post('/', async function(req, res, next) {
  let post = req.body;
  let result = await UserValidator.main(post);
    if(result != "Passed"){
      res.status(400).send("Bad Request \n"+result);
    return;
  }
  await db.addUser(post, res);

});
module.exports = router;
