const request = require('supertest')
const app = require('../app')

describe('Post Endpoints', () => {
  it('should create a new post', async () => {
    const res = await request(app)
      .post('/v1/user')
      .send({
        email_address:"test",
        password:"Pranit123#",
        first_name:"pranit",
        last_name:"shetty"
      })
    expect(res.statusCode).toEqual(400)
  })
})

describe('Get Endpoints', () => {
    it('should get', async () => {
      const res = await request(app)
        .get('/v1/user/self')
      expect(res.statusCode).toEqual(401)
    })
  })