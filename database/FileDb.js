let models = require("../models");
let dbBill = require("./BillDb");
addFile = (file_name, file_url, bill) => {
  return models.File.create({
    file_name: file_name,
    url: file_url
  }).then(file => {
    file = file.toJSON();
    bill.attachment = file.file_id;
    return models.Bill.update(bill, {
      where: {
        id: bill.id
      },
      subQuery: false,
      raw: true,
      limit: 1
    }).then(() => {
      return file;
    });
  });
};

deleteById = (id, res) => {
  return models.File.destroy({
    where: {
      file_id: id
    },
    include: [
      {
        model: models.File,
        as: "file"
      }
    ]
  }).then(() => {
    return res.status(204).send();
  });
};

module.exports = { addFile, deleteById };
