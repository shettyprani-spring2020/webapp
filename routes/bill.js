var express = require("express");
var router = express.Router();
let auth = require("basic-auth");
let hash = require("../validator/Bcrypt");
let dbUser = require("../database/UserDb");
let dbBill = require("../database/BillDb");
let dbFile = require("../database/FileDb");
let formidable = require("formidable");
let Transform = require("stream").Transform;
let AWS = require("aws-sdk");
let fs = require("fs");

// authenticated user variable
let user;

let dirname = ".";
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
  if (req.query.id != undefined) {
    next();
    return;
  }
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
  if (url.includes("file")) {
    next();
    return;
  }
  if (url.includes("bills")) {
    dbBill.findAll(user, res).then(bills => {
      return res.status(200).send(bills);
    });
  } else {
    const id = req.query.id;
    if (id == undefined) {
      return res.status(400).send("Bad Request");
    }
    dbBill.findById(id, user, res).then(resp => {
      res.status(200).send(resp);
    });
  }
});

// Delete bill based on ID
router.delete("/", async (req, res, next) => {
  if (req.originalUrl.includes("file")) {
    return next();
  }
  if (req.originalUrl.includes("bills")) {
    return res.status(400).send("Bad Request");
  }

  const id = req.query.id;
  if (id == undefined) {
    return res.status(400).send("Bad Request");
  }
  let bill = await dbBill.findById(id, user, res);
  uploadParams.Key = bill.file_name;
  s3.deleteObject(uploadParams, function(err, data) {
    if (err) {
      console.log("Error deleting file"); // error
      res.status(500).send("Error deleting file");
    } else {
      console.log("Delete Successful");
      dbBill.DeleteById(id, user, res);
    }
  });
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
  dbBill.UpdateById(id, put, user, res).then(bill => {
    res.status(200).send(bill);
  });
});

router.post("/", async (req, res, next) => {
  // ---------------------
  let s3_config = require("../../config/s3_bucket.json");
  s3 = new AWS.S3();
  let uploadParams = { Bucket: s3_config.s3_bucket_name, Key: "", Body: "" };
  let id = req.query.id.split("/")[0];
  if (!req.originalUrl.includes("file")) {
    return res.status(400).send("Bad Request");
  }
  let bill = await dbBill.findById(id, user, res);
  if (bill.file != null) {
    return res.status(400).send("Bad Request\nFile already exists");
  }
  let form = new formidable.IncomingForm();
  form.hash = "md5";
  form.parse(req);
  form.uploadDir = "file_upload";
  form.onPart = function(part) {
    console.log(part);
    if (!part.filename || !part.filename.match(/\.(jpg|jpeg|png|pdf)$/i)) {
      console.log(part.filename + " is not allowed");
      return res.status(400).send("Format not allowed");
    } else {
      this.handlePart(part);
    }
  };
  form.on("fileBegin", (name, file) => {
    if (
      !["application/pdf", "image/png", "image/jpg", "image/jpeg"].includes(
        file.type
      )
    ) {
      return res.status(400).send();
    }
    file.on("error", e => this._error(e));
    file.open = async function() {
      this._writeStream = new Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk);
        }
      });

      this._writeStream.on("error", e => this.emit("error", e));
      uploadParams.Body = this._writeStream;
      uploadParams.Key = bill.id + "_" + file.name;
      await s3.upload(uploadParams, async (err, data) => {
        if (err) {
          console.log("Error", err);
          res.status(500).send("ERROR uploading");
        }
        if (data) {
          console.log("Upload Success", data.Location);
          const metadata = {
            size: file.size,
            type: file.type,
            hash: file.hash,
            lastModifiedDate: file.lastModifiedDate
          };
          let file_created = await dbFile.addFile(
            bill.id + "_" + file.name,
            dirname + s3_config.s3_bucket_name,
            metadata,
            bill
          );
          res.send(file_created);
        }
      });
    };
    file.end = function(cb) {
      this._writeStream.on("finish", () => {
        this.emit("end");
        cb();
      });
      this._writeStream.end();
    };
  });
  form.on("file", async (name, file) => {
    console.log("UPLOADED " + file.name);
  });
});

router.get("/", async (req, res, next) => {
  let bill_id = req.query.billId;
  const file_id = req.query.fileId;
  if (bill_id == undefined || file_id == undefined) {
    return res.status(400).send("Bad Request\nWrong parameters");
  }
  bill_id = bill_id.split("/")[0];
  let bill = await dbBill.findById(bill_id, user, res);
  if (bill.file == null) {
    return res.status(400).send("Bad Request\nNo file");
  }
  if (bill.file.file_id != file_id) {
    return res.status(400).send("Bad Request\nWrong File Id");
  }

  return res.status(200).send(bill.file);
});

router.delete("/", async (req, res, next) => {
  let bill_id = req.query.billId;
  const file_id = req.query.fileId;
  if (bill_id == undefined || file_id == undefined) {
    return res.status(400).send("Bad Request\nWrong parameters");
  }
  bill_id = bill_id.split("/")[0];
  let bill = await dbBill.findById(bill_id, user, res);
  if (bill.file == null) {
    return res.status(400).send("Bad Request\nNo file");
  }
  if (bill.file.file_id != file_id) {
    return res.status(400).send("Bad Request\nWrong File Id");
  }
  let s3_config = require("../../config/s3_bucket.json");
  s3 = new AWS.S3();
  let deleteParams = {
    Bucket: s3_config.s3_bucket_name,
    Key: bill.file.file_name
  };
  s3.deleteObject(deleteParams, function(err, data) {
    if (err) {
      console.log("Error deleting file");
      res.status(500).send("Error deleting file");
    } else {
      console.log("Delete Successful " + data);
      dbFile.deleteById(file_id, res);
    }
  });
});

module.exports = router;
