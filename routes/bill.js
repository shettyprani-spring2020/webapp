var express = require("express");
var router = express.Router();
let auth = require("basic-auth");
let hash = require("../validator/Bcrypt");
let dbUser = require("../database/UserDb");
let dbBill = require("../database/BillDb");

router.all("*", async (req, res, next) => {
  let info = auth(req);
  if (info == undefined) {
    return res.status(401).send("Unauthorization");
  } else {
    let user = await dbUser.login(info.name);
    user = user[0];
    let pass = info.pass;
    if (user.length == 0 || !hash.loginCompare(pass, user.password)) {
      return res.status(401).send("Wrong username or password!");
    }
    next();
  }
});

router.post("/", async (req, res, next)=>{
    const Bill = req.body;
    const check = ["vendor", "bill_date", "due_date", "amount_due","categories","paymentStatus"];
    const keys = Object.keys(Bill);
    if(keys.length != 6){
      return res.status(400).send("Bad Request");
    }
    for(key of keys){
      if(!check.includes(key)){
        return res.status(400).send("Bad Request!");
      }
    }
    if(!["paid","due","past_due","no_payment_required"].includes(Bill.paymentStatus)){
      return res.status(400).send("Bad Request");
    }
    if(Bill.amount_due <= 0.0){
      return res.status(400).send("Bad Request");
    }
    let info = auth(req);
    let user =  await dbUser.findAll("email_address", info.name);
    user = user[0];
    Bill.categories = Bill.categories.split(',');
    console.log("HERE"+user.id)
    dbBill.addBill(Bill, user, res);
})

router.get("/bills", async (req, res, next)=>{
  if(req.originalUrl.contains("bills")){
    let info = auth(req);
    let user =  await dbUser.findAll("email_address", info.name);
    user = user[0];
    dbBill.findAll(user, res);
  }
})


router.get(/\/(:id)?/, async (req, res, next)=>{
  let info = auth(req);
  let user =  await dbUser.findAll("email_address", info.name);
  user = user[0];
  const url = req.originalUrl
  if(url.includes("bills")){
    dbBill.findAll(user, res);
  }else{
    const id = req.query.id;
    if(id == undefined){
      return res.status(400).send("Bad Request")
    }
    console.log(id)
    dbBill.findById(id,user, res)
  }
})



module.exports = router;
