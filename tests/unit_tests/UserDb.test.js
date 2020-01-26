const app = require("../../app");
const dbUser = require("../../database/UserDb");
const models = require("../../models");
let user = {
    first_name: "pranit",
    last_name: "shetty",
    email_address: "testemail@gmail.com",
    password: "testPassword123@"
  };
let new_user;

describe("Testing user database queries",()=>{

    beforeAll(async ()=>{
        await models.sequelize.sync({force:true});
      })

    it("Create a new User", async ()=>{
        new_user = await dbUser.addUser(user);
        let keys = Object.keys(new_user);
        expect(keys.includes("id"))
    })

    it("Find user",async ()=>{
        let get_user = await dbUser.findAll("email_address", user.email_address);
        expect(get_user == new_user)
    })

    it("Login user", async ()=>{
        let login_user = await dbUser.login(user.email_address);
        expect(login_user == new_user)
    })

    it("Update User", async ()=>{
        let updated_user = await dbUser.updateUser(user.email_address, user);
        expect(updated_user)
    })

    it("Delete account", async ()=>{
        expect(await dbUser.deleteByEmail(user.email_address));
    })

})