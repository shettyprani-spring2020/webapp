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

addUser = (post,res) => {
  post.password = hashing.encrypt(post.password);
  models.User.create(
    (values = {
      password: post.password,
      first_name: post.first_name,
      last_name: post.last_name,
      email_address: post.email_address,
      account_created: Date().toLocaleString(),
      account_updated: Date().toLocaleString()
    })
  ).then(data =>{
    let user = data.toJSON();
    delete user["password"];
    return res.status(201).send(user);
  });
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
