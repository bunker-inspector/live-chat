const express = require('express')
const fs = require('fs')
const _ = require('lodash')
const bodyParser = require('body-parser')
const pug = require('pug')
const expressWs = require('express-ws')
const request = require('request')

const port = process.env.PORT
const apiKey = process.env.APIKEY

const maxResults = 50
const changeVideoMins = 5
const commentFetchRate = 1

const renderChatUi = pug.compileFile('templates/chatui.pug')
const baseHtml = fs.readFileSync(__dirname + '/static/base.html', 'utf8', (err, html) => {
  if (err) {
    console.log('An internal error occurred that prevented the service from starting. Exiting...')
    process.exit()
  }
})

function sendFile(req, res) {
  res.sendFile(`${__dirname}/${req.path}`)
}

function shutdown(server) {
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

const app = express()
expressWs(app)

var currentUsers = {}
var chatLog = []
var video = ''

function setNewVideo() {
  let target = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&videoCategoryId=20&regionCode=US&maxResults=${maxResults}&key=${apiKey}`
  request({ url: target },
    (error, response, body) => {
      if (!error && body) {
        video = JSON.parse(body).items[Math.floor(Math.random()*maxResults)].id.videoId
        console.log(`Switching to video: ${video}`)

        chatLog.length = 0

        _.each(currentUsers, (currentUser, key) => {
          if (currentUser.socket) {
            currentUser.socket.send(JSON.stringify({
              videoUpdate: video,
              chatLog: renderChatUi({
                me: _.assign(currentUser, {id: key}),
                users: _.pick(currentUsers, ['socket']),
                messages: chatLog
              })
            }))
          }
        })
      }
    })
}

setNewVideo()

setInterval(setNewVideo, changeVideoMins*600000)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
  res.setHeader('Connection', 'close')
  next()
})

app.get('/js/:file', sendFile);
app.get('/css/:file', sendFile);

app.get('/posts/:user', (req, res) => {
  res.send(_.filter(chatLog, (message) => {
    return message.uid === req.params.user
  }))
})

app.post('/new-message', (req, res) => {
  if (req.body.text === '/next') {
    res.send('OK')
    setNewVideo()
  }
  else {
    chatLog.push(req.body)

    if (chatLog.length > 500) {
      let toPrune = chatLog.length - 500

      for (var i = 0; i < toPrune; i++) {
          chatLog.shift()
      }
    }

    _.each(currentUsers, (currentUser, key) => {
      if (currentUser.socket) {
        currentUser.socket.send(JSON.stringify({
          chatLog: renderChatUi({
            me: _.assign(currentUser, {id: key}),
            users: currentUsers,
            messages: chatLog
          })
        }))
      }
    })

    res.send(chatLog)
  }
})

app.post('/join', (req, res) => {
  console.log(req.body.id)
  currentUsers[req.body.id] = {
    name: req.body.name,
    image: req.body.image
  }

  var rendered = renderChatUi({
    me: req.body,
    users: currentUsers,
    messages: chatLog
  })
  res.send(`
    <div id="video">
      <iframe width="560" height="315" display="block" src="https://www.youtube.com/embed/${video}?autoplay=1" frameborder="0" allowfullscreen></iframe>
    </div>
    <div id="container" class="my-scrollable">
      ${rendered}
    </div>
    ${baseHtml}`)
})

app.get('/', (req, res) => {
  res.sendFile('index.html',
      { root: __dirname } );
})

app.ws('/register/:id', (ws, req) => {
    currentUsers[req.params.id].socket = ws
})

app.delete('/leave/:id', (req, res) => {
  delete currentUsers[req.params.id]
})

let server = app.listen(port, () => {
  console.log(`Running on port ${port}!`)
})

process.on('SIGTERM', shutdown.bind(null, server));
process.on('SIGINT', shutdown.bind(null, server));

_.forEach(app._router.stack, r => {
  if (r.route && r.route.path){
    for (var key in r.route.methods) {
      if (r.route.methods[key]) console.log(`${key}\t${r.route.path}`)
    }
  }
})

module.exports = app
