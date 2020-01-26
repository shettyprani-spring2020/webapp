const request = require("supertest");
const app = require("../../app");
const dbUser = require("../../database/UserDb");
let user = {
  first_name: "pranit",
  last_name: "shetty",
  email_address: "testemail@gmail.com",
  password: "testPassword123@"
};

describe("Test Endpoints", () => {
  // beforeAll(async ()=>{
  //   user = await dbUser.addUser(user);
  // })

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
        console.log(res.body);
      });
  });

  it("check get response", async () => {
    let res = await request(app)
      .get("/v1/user/self")
      .then(res => {
        expect(res.statusCode).toEqual(401);
      });
  });
});
