const express = require('express')
const fs = require('fs')
const _ = require('lodash')

function sendFile(req, res) {
  res.sendFile(`${__dirname}/${req.path}`)
}

function shutdown(server) {
  console.log("Received kill signal, shutting down...")
  server.close(() => {
    console.log("Closed out remaining connections.")
    process.exit()
  })

  setTimeout(() => {
    console.error("Could not close connections in time, forcefully shutting down")
    process.exit()
  }, 10000)
}

fs.readFile(' chatLog.json', 'utf8', function (err, data) {
  if (err) {
    console.log('Failed to initialize app. Shutting down...')
    this.chatLog = {}
  }
  else {
    this.chatLog = JSON.parse(data)
  }
  module.exports = init.call(this)
})



function init() {
  const app = express()
  var chatLog = this.chatLog

  app.get('/js/:file', sendFile);
  app.get('/css/:file', sendFile);

  app.get('/getLog', (req, res) => {
    res.send(chatLog)
  })

  app.post('/new-message', (req, res) => {

  })

  app.delete('/clear', (req, res) => {
    //dun dun dunnnn
    chatLog = {}
  })

  app.get('/', (req, res) => {
    res.sendFile('index.html',
        { root: __dirname } );
  });

  let server = app.listen(8080)

  process.on('SIGTERM', shutdown.bind(null, server));
  process.on('SIGINT', shutdown.bind(null, server));

  return app
}
