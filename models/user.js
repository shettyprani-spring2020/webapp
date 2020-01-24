'use strict';
let Bills =  require('./index').Bill;

module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    email_address: DataTypes.STRING,
    password: DataTypes.STRING,
    account_created : {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    },
    account_updated : {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    }
  });

  User.associate = (models) =>{
    const {User, Bill} = models;
    User.hasMany(Bill, {
      foreignKey: "owner_id"
    });
  };

  return User;
};
