var express = require("express");
var router = express.Router();
let auth = require("basic-auth");
let hash = require("../validator/Bcrypt");
let dbUser = require("../database/UserDb");
let dbBill = require("../database/BillDb");

// authenticated user variable
let user;

// Authenticate all end points
router.all("*", async (req, res, next) => {
  let info = auth(req);
  if (info == undefined) {
    return res.status(401).send("Unauthorization");
  } else {
    user = await dbUser.login(info.name);
    user = user[0];
    let pass = info.pass;
    if (user == undefined) {
      return res.status(401).send("Unauthorization");
    }
    if (user.length == 0 || !hash.loginCompare(pass, user.password)) {
      return res.status(401).send("Wrong username or password!");
    }
    next();
  }
});

// Create new bills only will all fields are provided
router.post("/", (req, res, next) => {
  const Bill = req.body;
  const check = [
    "vendor",
    "bill_date",
    "due_date",
    "amount_due",
    "categories",
    "paymentStatus"
  ];
  const keys = Object.keys(Bill);
  if (req.originalUrl.includes("bills")) {
    return res.status(400).send("Bad Request");
  }
  if (keys.length != 6) {
    return res.status(400).send("Bad Request");
  }
  for (key of keys) {
    if (!check.includes(key)) {
      return res.status(400).send("Bad Request!");
    }
  }
  if (!Date.parse(Bill.due_date) || !Date.parse(Bill.bill_date)) {
    return res.status(400).send("Bad Request");
  }
  if (
    !["paid", "due", "past_due", "no_payment_required"].includes(
      Bill.paymentStatus
    )
  ) {
    return res.status(400).send("Bad Request");
  }
  if (Bill.amount_due <= 0.0) {
    return res.status(400).send("Bad Request");
  }
  Bill.categories = Bill.categories.split(",");
  dbBill.addBill(Bill, user, res).then(data => {
    return res.status(201).send(data);
  });
});

// Get ALL details or
// Get only detail of id provided
router.get(/\/(:id)?/, (req, res, next) => {
  const url = req.originalUrl;
  if (url.includes("bills")) {
    dbBill.findAll(user, res).then(bills => {
      return res.status(200).send(bills);
    });
  } else {
    const id = req.query.id;
    if (id == undefined) {
      return res.status(400).send("Bad Request");
    }
    dbBill.findById(id, user, res);
  }
});

// Delete bill based on ID
router.delete("/", (req, res, next) => {
  if (req.originalUrl.includes("bills")) {
    return res.status(400).send("Bad Request");
  }

  const id = req.query.id;
  if (id == undefined) {
    return res.status(400).send("Bad Request");
  }
  dbBill.DeleteById(id, user, res);
});

// Update bill based on ID
router.put("/", (req, res, next) => {
  const put = req.body;
  const check = [
    "vendor",
    "bill_date",
    "due_date",
    "amount_due",
    "categories",
    "paymentStatus"
  ];
  const keys = Object.keys(put);
  if (req.originalUrl.includes("bills")) {
    return res.status(400).send("Bad Request");
  }
  if (put == undefined) {
    return res.status(400).send("Bad Request");
  }
  if (!Date.parse(put.due_date) || !Date.parse(put.bill_date)) {
    return res.status(400).send("Bad Request");
  }
  if (keys.length != 6) {
    return res.status(400).send("Bad Request");
  }
  for (key of keys) {
    if (!check.includes(key)) {
      return res.status(400).send("Bad Request");
    }
  }
  if (put.amount_due <= 0.0) {
    return res.status(400).send("Bad Request");
  }
  if (
    !["paid", "due", "past_due", "no_payment_required"].includes(
      put.paymentStatus
    )
  ) {
    return res.status(400).send("Bad Request");
  }

  const id = req.query.id;
  if (id == undefined) {
    return res.status(400).send("Bad Request");
  }
  put.categories = put.categories.split(",");
  dbBill.UpdateById(id, put, user, res);
});

module.exports = router;
