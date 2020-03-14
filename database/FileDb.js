let models = require("../models");
let dbBill = require("./BillDb");
let logger = require("../logger/log");
addFile = (file_name, file_url, metadata, bill) => {
  return models.File.create({
    file_name: file_name,
    url: file_url,
    metadata: metadata
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
      logger.info("Successfully added file metadata to DB");
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
    logger.info("Successfully removed file metadata to DB");
    return res.status(204).send();
  });
};

module.exports = { addFile, deleteById };
