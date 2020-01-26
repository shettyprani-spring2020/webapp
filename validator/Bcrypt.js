let bcrypt = require("bcryptjs");
let salt = bcrypt.genSaltSync(10);

encrypt = password => {
  return bcrypt.hashSync(password, salt);
};

loginCompare = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

module.exports = {
  encrypt: encrypt,
  loginCompare: loginCompare
};
