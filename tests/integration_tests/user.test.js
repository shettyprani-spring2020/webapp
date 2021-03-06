const request = require("supertest");
const app = require("../../app");
const models = require("../../models");
const dbUser = require("../../database/UserDb");
let user = {
  first_name: "pranit",
  last_name: "shetty",
  email_address: "testemail@gmail.com",
  password: "testPassword123@"
};

describe("Test Endpoints", () => {
  beforeAll(async () => {
    await models.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await dbUser
      .deleteByEmail(user.email_address)
      .then(res => console.log(res))
      .catch(e => console.log(e));
  });

  it("should create a new post", async () => {
    let res = await request(app)
      .post("/v1/user")
      .send(user)
      .then(res => {
        expect(res.statusCode).toEqual(201);
      });
  });

  it("check get response", async () => {
    let res = await request(app)
      .get("/v1/user/self")
      .auth(user.email_address, user.password)
      .then(res => {
        expect(res.statusCode).toEqual(200);
      });
  });

  it("update user", async () => {
    let updated_user = {
      first_name: "update",
      last_name: "update",
      email_address: "testemail@gmail.com",
      password: "testPassword123@"
    };
    let res = await request(app)
      .put("/v1/user/self")
      .send(updated_user)
      .auth(user.email_address, user.password)
      .then(res => {
        expect(res.statusCode).toEqual(204);
      });
  });
});
