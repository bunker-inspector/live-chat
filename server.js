const express = require('express')
const fs = require('fs')
const _ = require('lodash')
const bodyParser = require('body-parser')
const request = require('request')
const Promise = require('promise')

const port = process.env.PORT
const apiKey = process.env.APIKEY

console.log(apiKey)

const maxResults = 50

const app = express()

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

function httpGetPromise(url) {
  return new Promise((resolve, reject) => {
    request({ url },
      (error, response, body) => {
        if (!error && body) {
          resolve(body)
        }
        else {
          reject(error)
        }
      })
  })
}

function getNewVideo(callback, error) {
  let target = `https://www.googleapis.com/youtube/v3/search?part=snippet&eventType=live&type=video&videoCategoryId=20&regionCode=US&maxResults=${maxResults}&key=${apiKey}`
  request({ url: target },
    (error, response, body) => {
      if (!error && body) {
        video = JSON.parse(body).items[Math.floor(Math.random()*maxResults)].id.videoId
        console.log(`Switching to video: ${video}`)

        callback(video)
      }
      else {
        error()
      }
    })
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use((req, res, next) => {
  res.setHeader('Connection', 'close')
  next()
})

app.get('/js/:file', sendFile);
app.get('/css/:file', sendFile);

app.get('/setvideo', (req, res) => {
  getNewVideo(videoId => {
      res.send(videoId)
    },
    () => {
      res.send('ERROR!')
    })
})

app.get('/', (req, res) => {
  res.sendFile('index.html',
      { root: __dirname } );
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
