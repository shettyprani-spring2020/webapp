let models = require("../models");
let hashing = require("../validator/Bcrypt");

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

updateUser = (email_address, put) => {
  let update = {};
  for (key of Object.keys(put)) {
    update[key] = put[key];
  }
  update["account_updated"] = Date().toLocaleString();
  models.User.update(update, {
    where: { email_address }
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

login = (email)=>{
  return models.User.findAll({
    raw: true,
    where: {
      email_address:email
    }
  }).then(user => {
    return user;
  });
}

module.exports = { findAll, addUser, updateUser, login };
