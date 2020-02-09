"use strict";

module.exports = (sequelize, DataTypes) => {
  let File = sequelize.define("File", {
    file_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    file_name: DataTypes.STRING,
    url: DataTypes.STRING,
    upload_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  // File.associate = models => {
  //   const { User, Bill, File } = models;
  //   File.hasOne(Bill, {
  //     as: "file",
  //     foreignKey: "attachment"
  //   });
  // };

  return File;
};
