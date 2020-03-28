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
let logger = require("../logger/log");

let StatsD = require("hot-shots"),
  client = new StatsD();

// authenticated user variable
let user;

let dirname = ".";
// Authenticate all end points
router.all("*", async (req, res, next) => {
  let info = auth(req);
  if (info == undefined) {
    logger.info("Unauthorized access");
    return res.status(401).send("Unauthorized");
  } else {
    user = await dbUser.login(info.name);
    user = user[0];
    let pass = info.pass;
    if (user == undefined) {
      return res.status(401).send("Unauthorized");
    }
    if (user.length == 0 || !hash.loginCompare(pass, user.password)) {
      return res.status(401).send("Wrong username or password!");
    }
    next();
  }
});

// Create new bills only when all fields are provided
router.post("/", (req, res, next) => {
  let time = new Date();
  client.increment("new_bill", 1);
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
  client.timing("new_bill_time", Date.now() - time);
  dbBill.addBill(Bill, user, res).then(data => {
    return res.status(201).send(data);
  });
});

// Get ALL details or
// Get only detail of id provided
router.get(/\/(:id)?/, (req, res, next) => {
  client.increment("get_bill", 1);
  let time = new Date();
  const url = req.originalUrl;
  if (url.includes("file") || url.includes("due")) {
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
    client.timing("get_bill_time", Date.now() - time);
    dbBill.findById(id, user, res).then(resp => {
      res.status(200).send(resp);
    });
  }
});

// Delete bill based on ID
router.delete("/", async (req, res, next) => {
  client.increment("delete_bill", 1);
  let time = new Date();
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
  if (bill.file != undefined) {
    let s3_config = require("../../config/s3_bucket.json");
    s3 = new AWS.S3();
    let deleteParams = {
      Bucket: s3_config.s3_bucket_name,
      Key: bill.file.file_name
    };
    s3.deleteObject(deleteParams, function(err, data) {
      if (err) {
        logger.error("Error deleting file");
        res.status(500).send("Error deleting file");
      } else {
        logger.info("Delete Successful");
        client.timing("delete_bill_time", Date.now() - time);
        dbBill.DeleteById(id, user, res);
      }
    });
  }
});

// Update bill based on ID
router.put("/", (req, res, next) => {
  client.increment("update_bill", 1);
  let time = new Date();
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
  client.timing("update_bill_time", Date.now() - time);
  dbBill.UpdateById(id, put, user, res).then(bill => {
    res.status(200).send(bill);
  });
});

router.post("/", async (req, res, next) => {
  client.increment("new_file", 1);
  let time = new Date();
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
    if (!part.filename || !part.filename.match(/\.(jpg|jpeg|png|pdf)$/i)) {
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
      const s3_time = new Date();
      await s3.upload(uploadParams, async (err, data) => {
        if (err) {
          logger.error("Error Uploading", err);
          res.status(500).send("ERROR uploading");
        }
        if (data) {
          logger.info("Upload Success");
          client.timing("s3_add_file", Date.now() - s3_time);
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
          client.timing("new_file_time", Date.now() - time);
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
    logger.info("UPLOADED");
  });
});

router.get("/", async (req, res, next) => {
  client.increment("get_file", 1);
  let time = new Date();
  if (url.includes("due")) {
    next();
    return;
  }
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
  client.timing("get_file_time", Date.now() - time);
  return res.status(200).send(bill.file);
});

router.delete("/", async (req, res, next) => {
  client.increment("delete", 1);
  let time = new Date();
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
  const s3_time = new Date();
  s3.deleteObject(deleteParams, function(err, data) {
    if (err) {
      logger.error("Error deleting file");
      return res.status(500).send("Error deleting file");
    } else {
      logger.info("Delete Successful " + data);
      client.timing("s3_delete_file", Date.now() - s3_time);
      client.timing("delete_file_time", Date.now() - time);
      dbFile.deleteById(file_id, res);
    }
  });
});

router.get("/due/:days", (req, res) => {
  const days_left = req.params.days;

  if (!Number.isInteger(days_left)) {
    return res.status(400).send("Bad Request");
  }
  logger.info("Due date of bills Lambda function");
  dbBill.findAll(user, res).then(bills => {
    const due = [];
    date_diff = date => {
      const diff_days = Math.ceil(
        (date.getTime() - new Date()) / (1000 * 3600 * 24)
      );
      if (diff_days <= days_left) {
        return true;
      }
    };
    for (var bill of bills) {
      if (date_diff(new Date(bill.due_date))) {
        if (bill.paymentStatus == "due") {
          due.push(bill.dataValues);
        }
      }
      ue.len;
    }
    // Send to user
    if (due.length == 0) {
      return res.status(200).send("No bills due!");
    }
    res.status(200).send(due);
    // background task of publishing to sns
    let sns_config = require("../../config/sns_config.json");
    let msg = {
      bills: due,
      email: user.email_address
    };
    AWS.config.update({ region: "us-east-1" });
    let params = {
      Message: JSON.stringify(msg),
      TopicArn: sns_config.topic_arn
    };

    var publishPromise = new AWS.SNS({ apiVersion: "2010-03-31" })
      .publish(params)
      .promise();

    publishPromise
      .then(function(data) {
        console.log(
          `Message ${params.Message} send sent to the topic ${params.TopicArn}`
        );
        logger.info("Message published to SNS");
      })
      .catch(function(err) {
        logger.error("Error publishing the data " + err);
      });
  });
});

module.exports = router;
