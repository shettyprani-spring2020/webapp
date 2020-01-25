let models = require("../models");

addBill = (Bill, user, res) => {
    models.Bill.create({
        vendor: Bill.vendor,
        bill_date: Bill.bill_date,
        due_date: Bill.due_date,
        amount_due: Bill.amount_due,
        owner_id:user.id,
        categories: Bill.categories,
        paymentStatus: Bill.paymentStatus
    },{
        include: [models.User]
    }).then(data =>{
        return res.status(201).send(data);
    }).catch(err=>{
        res.status(500).send(err);
    })
}

findAll = (user, res) =>{
    models.Bill.findAll({
        where:{
            owner_id: user.id
        },
        subQuery: false,
        raw:true,
        include:[{
            model: models.User,
            as:'user'
        }]
    }).then(bills=>{
        return res.status(200).send(bills);
    })
}

findById = (id, user, res) =>{
    models.Bill.findAll({
        where:{
            id: id,
            owner_id: user.id
        },
        subQuery: false,
        raw:true,
        limit:1,
        include:[{
            model: models.User,
            as:'user'
        }]
    }).then(bills=>{
        if(bills.length == 0){
            return res.status(404).send("Not found");
        }
        return res.status(200).send(bills[0]);
    })
}

module.exports = { addBill, findAll, findById}