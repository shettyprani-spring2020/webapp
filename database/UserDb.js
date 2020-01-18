let models = require("../models");
let hashing = require("../validator/Bcrypt");

findAll = (key, value) => {
  if (key == undefined) {
    return models.User.findAll({
      raw: true
    }).then(users => {
      return users;
    });
  } else {
    let where = {};
    where[key] = value;
    return models.User.findAll({
      raw: true,
      where: where
    }).then(user => {
      return user;
    });
  }
};

updateUser = (id, put) => {
  let update = {};
  for (key of Object.keys(put)) {
    update[key] = put[key];
  }
  console.log(update);
  update["account_updated"] = Date().toLocaleString();
  models.User.update(update, {
    where: { id }
  })
    .then(res => {
      console.log(res);
      return true;
    })
    .catch(() => {
      return false;
    });
};

addUser = post => {
  post.password = hashing.encrypt(post.password);
  models.User.create(
    (values = {
      email_address: post.email_address,
      password: post.password,
      first_name: post.first_name,
      last_name: post.last_name,
      account_created: Date().toLocaleString(),
      account_updated: Date().toLocaleString()
    })
  );
};

module.exports = { findAll, addUser, updateUser };
