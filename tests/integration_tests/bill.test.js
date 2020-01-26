const request = require("supertest");
const app = require("../../app");
const models = require("../../models");
const dbUser = require("../../database/UserDb");
const dbBill = require("../../database/BillDb");
let user = {
  first_name: "pranit",
  last_name: "shetty",
  email_address: "testemail@gmail.com",
  password: "testPassword123@"
};
let ret_user;

let bill = {
  vendor: "NEU",
  bill_date: "2020-01-06",
  due_date: "2020-01-12",
  amount_due: "112312",
  categories: "college,tution",
  paymentStatus: "due"
};
let id;

describe("Testing bill endpoints", () => {
  beforeAll(async () => {
    await models.sequelize.sync({ force: true });
    let res = await request(app)
      .post("/v1/user")
      .send(user);
    ret_user = res.body;
  });

  afterAll(async () => {
    await dbBill.DeleteById(id, ret_user.id, null);
    await dbUser
      .deleteByEmail(user.email_address)
      .then(res => console.log(res))
      .catch(e => console.log(e));
  });

  it("creating new bill", async () => {
    let res = await request(app)
      .post("/v1/bill")
      .auth(user.email_address, user.password)
      .send(bill)
      .then(res => {
        expect(res.statusCode).toEqual(201);
        id = res.body.id;
      });
  });

  it("getting all new bill", async () => {
    let res = await request(app)
      .get("/v1/bills")
      .auth(user.email_address, user.password)
      .then(res => {
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body));
      });
  });

  it("getting new bill by id", async () => {
    let res = await request(app)
      .get("/v1/bill/?id=" + id)
      .auth(user.email_address, user.password)
      .then(res => {
        expect(res.statusCode).toEqual(200);
        expect(res.body.id == id);
      });
  });
});
