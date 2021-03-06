"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
let env = process.env.NODE_ENV || "development";
const db = {};

let sequelize;
if (env == "test") {
  let config_test = require(__dirname + "/../config/config.test.json")[env];
  sequelize = new Sequelize(
    config_test.database,
    config_test.username,
    config_test.password,
    config_test
  );
} else {
  env = "development";
  const config = require(__dirname + "/../../config/config.json")[env];
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ssl: true,
    host: config.host,
    dialect: config.dialect,
    dialectOptions: {
      ssl: "Amazon RDS",
    },
  });
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = sequelize["import"](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
