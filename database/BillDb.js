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
        include: [{
            model:models.User,
            as: 'user'
        }]
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
        raw:false
    }).then(bills=>{
        return res.status(200).send(bills);
    })
}

findById = (id, user, res) =>{
    models.Bill.findAll({
        where:{
            id: id
        },
        subQuery: false,
        limit:1
    }).then(bills=>{
        if(bills.length == 0){
            return res.status(404).send("Not found");
        }
        if(bills[0].owner_id != user.id ){
            console.log()
            return res.status(401).send("Unauthorized")
        }
        return res.status(200).send(bills[0]);
    })
}

DeleteById = (id, user, res) =>{
    models.Bill.findAll({
        where:{
            id: id
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
            return res.status(404).send("Not Found")
        }
        if(bills[0].owner_id != user.id ){
            return res.status(401).send("Unauthorized")
        }
        models.Bill.destroy({
            where:{
                id: id
            },
            subQuery: false,
            raw:true,
            limit:1,
            include:[{
                model: models.User,
                as:'user'
            }]
        }).then(()=>{
            return res.status(204).send();
        })
    })
}

UpdateById = (id, put, user, res)=>{
    models.Bill.findAll({
        where:{
            id: id
        },
        subQuery: false,
        limit:1,
        include:[{
            model: models.User,
            as:'user'
        }]
    }).then(bills=>{
        if(bills.length == 0){
            return res.status(404).send("Not Found")
        }
        if(bills[0].owner_id != user.id ){
            return res.status(401).send("Unauthorized")
        }

        models.Bill.update(put, {
            where:{
                id: id
            },
            subQuery: false,
            raw:true,
            limit:1,
            include:[{
                model: models.User,
                as:'user'
            }]
        }).then((ody)=>{
            findById(id,user,res);
        })
    })
}

module.exports = { addBill, findAll, findById, DeleteById, UpdateById}