let models = require("../models");
let hashing = require("../validator/Bcrypt");
let logger = require("../logger/log");
// find user details
// return JSON user details
findAll = (key, value) => {
  let where = {};
  where[key] = value;
  return models.User.findAll({
    raw: true,
    where: where
  }).then(user => {
    return user;
  });
};

// update user based on email_address
// return 204 no content
updateUser = (email_address, put) => {
  let update = {};
  for (key of Object.keys(put)) {
    update[key] = put[key];
  }
  update["account_updated"] = Date().toLocaleString();
  return models.User.update(update, {
    where: { email_address }
  })
    .then(res => {
      logger.info("Successfully updated user ");
      return true;
    })
    .catch(() => {
      logger.error("Error updating user");
      return false;
    });
};

// add new user
// return new user details
addUser = post => {
  post.password = hashing.encrypt(post.password);
  return models.User.create(
    (values = {
      password: post.password,
      first_name: post.first_name,
      last_name: post.last_name,
      email_address: post.email_address,
      account_created: Date().toLocaleString(),
      account_updated: Date().toLocaleString()
    })
  )
    .then(data => {
      logger.info("Added new user");
      let user = data.toJSON();
      delete user["password"];
      return user;
    })
    .catch(err => {
      logger.error("Error adding user");
      return err;
    });
};

deleteByEmail = email => {
  return models.User.destroy({
    where: {
      emaiL_address: email
    }
  })
    .then(user => {
      return true;
    })
    .catch(() => {
      logger.error("Error deleting user");
      return false;
    });
};

// check if user exists
login = email => {
  return models.User.findAll({
    raw: true,
    where: {
      email_address: email
    }
  }).then(user => {
    return user;
  });
};

module.exports = { findAll, addUser, updateUser, login, deleteByEmail };
