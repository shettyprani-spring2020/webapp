'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email_address: DataTypes.STRING,
    password: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    account_created : {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    },
    account_updated : {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    }
  });

  return User;
};