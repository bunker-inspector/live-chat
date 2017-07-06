const server = require('../index')
const chai = require('chai')
const chaiHttp = require('chai-http')
const should = chai.should()

chai.use(chaiHttp)

const host = 'http://localhost:8080'

describe('GET /chat-log', () => {
  it('Is valid endpoint', (done) => {
    chai
      .request(host)
      .get('/chat-log')
      .end((err, res) => {
          res.should.have.status(200)
        done()
      })
  })
  it('contents are correct', (done) => {
    chai
      .request(host)
      .get('/chat-log')
      .end((err, res) => {
          res.body.should.be.a('array')
        done()
      })
  })
})
