let models = require("../models");

let StatsD = require("hot-shots"),
  client = new StatsD();
// Add bill
// return Bill created
addBill = (Bill, user, res) => {
  let time = new Date();
  return models.Bill.create(
    {
      vendor: Bill.vendor,
      bill_date: Bill.bill_date,
      due_date: Bill.due_date,
      amount_due: Bill.amount_due,
      owner_id: user.id,
      categories: Bill.categories,
      paymentStatus: Bill.paymentStatus
    },
    {
      include: [
        {
          model: models.User,
          as: "user"
        }
      ]
    }
  )
    .then(data => {
      client.timing("DB_add_bill", Date.now() - time);
      return data;
    })
    .catch(err => {
      return err;
    });
};

// Find all bills for user
// return array of all bills
findAll = (user, res) => {
  let time = new Date();
  return models.Bill.findAll({
    where: {
      owner_id: user.id
    },
    subQuery: true,
    raw: false,
    attributes: { exclude: ["attachment"] },
    include: [
      {
        model: models.File,
        as: "file"
      }
    ]
  }).then(bills => {
    client.timing("DB_find_all_bill", Date.now() - time);
    return bills;
  });
};

// Full bill based on id
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - return JSON of bill queried
findById = (id, user, res) => {
  let time = new Date();
  return models.Bill.findAll({
    where: {
      id: id
    },
    subQuery: false,
    limit: 1,
    attributes: { exclude: ["attachment"] },
    include: [
      {
        model: models.File,
        as: "file"
      }
    ]
  }).then(bills => {
    if (bills.length == 0) {
      return res.status(404).send("Not found");
    }
    if (bills[0].owner_id != user.id) {
      console.log();
      return res.status(401).send("Unauthorized");
    }
    client.timing("DB_find_bill", Date.now() - time);
    return bills[0].toJSON();
  });
};

// Delete id based on id
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - No content
DeleteById = (id, user, res) => {
  let time = new Date();
  models.Bill.findAll({
    where: {
      id: id
    },
    subQuery: false,
    raw: true,
    limit: 1,
    include: [
      {
        model: models.File,
        as: "file"
      }
    ]
  }).then(bills => {
    if (bills.length == 0) {
      return res.status(404).send("Not Found");
    }
    if (bills[0].owner_id != user.id) {
      return res.status(401).send("Unauthorized");
    }

    if (bills[0]["file.file_id"]) {
      const file_id = bills[0]["file.file_id"];
      console.log(file_id);
      models.File.destroy({
        where: {
          file_id: file_id
        }
      }).then(() => {
        models.Bill.destroy({
          where: {
            id: id
          },
          subQuery: false,
          raw: true,
          limit: 1,
          include: [
            {
              model: models.User,
              as: "user"
            }
          ]
        }).then(() => {
          client.timing("DB_delete_bill", Date.now() - time);
          return res.status(204).send();
        });
      });
    } else {
      models.Bill.destroy({
        where: {
          id: id
        },
        subQuery: false,
        raw: true,
        limit: 1,
        include: [
          {
            model: models.User,
            as: "user"
          }
        ]
      }).then(() => {
        client.timing("DB_delete_bill", Date.now() - time);
        return res.status(204).send();
      });
    }
  });
};

// Update id based on ID
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - JSON of updated Bill
UpdateById = (id, put, user, res) => {
  let time = new Date();
  return models.Bill.findAll({
    where: {
      id: id
    },
    subQuery: false,
    limit: 1,
    include: [
      {
        model: models.User,
        as: "user"
      }
    ]
  }).then(bills => {
    if (bills.length == 0) {
      return res.status(404).send("Not Found");
    }
    if (bills[0].owner_id != user.id) {
      return res.status(401).send("Unauthorized");
    }

    return models.Bill.update(put, {
      where: {
        id: id
      },
      subQuery: false,
      raw: true,
      limit: 1,
      include: [
        {
          model: models.User,
          as: "user"
        }
      ]
    }).then(() => {
      client.timing("DB_update_bill", Date.now() - time);
      return findById(id, user, res);
    });
  });
};

module.exports = { addBill, findAll, findById, DeleteById, UpdateById };
