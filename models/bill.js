"use strict";

module.exports = (sequelize, DataTypes) => {
  var Bill = sequelize.define("Bill", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      alloNull: false
    },
    created_ts: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_ts: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    vendor: DataTypes.STRING,
    bill_date: DataTypes.STRING,
    due_date: DataTypes.STRING,
    amount_due: DataTypes.DOUBLE,
    categories: {
      type: DataTypes.STRING,
      allowNull: false,
      get() {
        return this.getDataValue("categories").split(",");
      },
      set(val) {
        return this.setDataValue("categories", val.join(","));
      }
    },
    paymentStatus: {
      type: DataTypes.ENUM,
      values: ["paid", "due", "past_due", "no_payment_required"]
    }
    // attachment: {
    //   type: DataTypes.UUID,
    //   allowNull: true,
    //   references: {
    //     model: "Files",
    //     key: "file_id"
    //   }
    // }
  });

  Bill.associate = models => {
    const { User, Bill, File } = models;
    File.hasOne(Bill, {
      as: "file",
      foreignKey: "attachment"
    });
    Bill.belongsTo(File, {
      as: "file",
      foreignKey: "attachment"
    });
  };

  return Bill;
};
