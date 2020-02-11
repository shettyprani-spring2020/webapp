let models = require("../models");

// Add bill
// return Bill created
addBill = (Bill, user, res) => {
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
      return data;
    })
    .catch(err => {
      return err;
    });
};

// Find all bills for user
// return array of all bills
findAll = (user, res) => {
  return models.Bill.findAll({
    where: {
      owner_id: user.id
    },
    subQuery: true,
    raw: false,
    include: [
      {
        model: models.File,
        as: "file"
      }
    ]
  }).then(bills => {
    return bills;
  });
};

// Full bill based on id
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - return JSON of bill queried
findById = (id, user, res) => {
  return models.Bill.findAll({
    where: {
      id: id
    },
    subQuery: false,
    limit: 1,
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
    return bills[0].toJSON();
  });
};

// Delete id based on id
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - No content
DeleteById = (id, user, res) => {
  models.Bill.findAll({
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
  }).then(bills => {
    if (bills.length == 0) {
      return res.status(404).send("Not Found");
    }
    if (bills[0].owner_id != user.id) {
      return res.status(401).send("Unauthorized");
    }
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
      return res.status(204).send();
    });
  });
};

// Update id based on ID
// 404 - Bill doesn't exist
// 401 - Bill doesn't belong to user
// return - JSON of updated Bill
UpdateById = (id, put, user, res) => {
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
      return findById(id, user, res);
    });
  });
};

module.exports = { addBill, findAll, findById, DeleteById, UpdateById };
