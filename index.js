const express = require('express')
const fs = require('fs')
const _ = require('lodash')
const bodyParser = require('body-parser')
const pug = require('pug')

const renderChatUi = pug.compileFile('templates/chatui.pug')

function sendFile(req, res) {
  res.sendFile(`${__dirname}/${req.path}`)
}

function shutdown(server, appData) {
  fs.writeFileSync('chatLog.json', JSON.stringify(appData), 'utf8', (err) => {
    console.log(appData)

    if (err) {
      console.err('An error occurred while attempting to save the app data...')
    }
    else {
      console.log('Data saved successfully!')
    }
  })

  console.log('Received kill signal, shutting down...')
  server.close(() => {
    console.log('Closed out remaining connections.')
    process.exit()
  })

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit()
  }, 10000)
}

fs.readFile('chatLog.json', 'utf8', function (err, data) {
  let fallbackAppData = { chatLog: [] }

  if (err) {
    console.log('Failed to initialize app. Shutting down...')
    this.appData = fallbackAppData
  }
  else {
    try {
      this.appData = JSON.parse(data)
    }
    catch (e) {
      this.appData = fallbackAppData
    }
  }
  module.exports = init.call(this)
})

function init() {
  const app = express()
  var currentUsers = {}
  var appData = this.appData
  var chatLog = this.appData.chatLog || []

  // handles case of appData being valid json
  // but not having chatLog attribute
  appData.chatLog = chatLog

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.use((req, res, next) => {
    res.setHeader('Connection', 'close')
    next()
  })

  app.get('/js/:file', sendFile);
  app.get('/css/:file', sendFile);

  app.get('/chat-log', (req, res) => {
    res.send(chatLog)
  })

  app.get('/posts/:user', (req, res) => {
    res.send(_.filter(chatLog, (message) => {
      return message.user === req.params.user
    }))
  })

  app.get('/current-users', (req, res) => {
    res.send(currentUsers)
  })

  app.post('/new-message', (req, res) => {
    chatLog[chatLog.length] = req.body
    res.send(chatLog)
  })

  app.post('/join', (req, res) => {
    currentUsers[req.body.id] = {
      name: req.body.name,
      image: req.body.image
    }
    var rendered = renderChatUi({
      me: req.body,
      users: currentUsers,
      messages: chatLog
    })
    console.log(rendered)
    res.send(rendered)
  })

  app.delete('/clear', (req, res) => {
    //dun dun dunnnn
    chatLog.length = 0
    res.send(chatLog)
  })

  app.get('/', (req, res) => {
    res.sendFile('index.html',
        { root: __dirname } );
  })

  let server = app.listen(8080, () => {
    console.log('Running on port 8080!')
  })

  process.on('SIGTERM', shutdown.bind(null, server, appData));
  process.on('SIGINT', shutdown.bind(null, server, appData));

  _.forEach(app._router.stack, r => {
    if (r.route && r.route.path){
      for (var key in r.route.methods) {
        if (r.route.methods[key]) console.log(`${key}\t${r.route.path}`)
      }
    }
  })

  return app
}
