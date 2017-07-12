const USER = 'user'
const SOCKET = 'socket'
const CHAT_ID = 'chatId'

$(document).ready(function () {
  window.addEventListener("beforeunload", signOut)
});

function handleMessage(event) {
  let data = JSON.parse(event.data)

  if (data.videoUpdate) {
    $('#video').html(`<iframe width="500" height="315" src="https://www.youtube.com/embed/${data.videoUpdate}?autoplay=1" frameborder="0" allowfullscreen></iframe>`)
  }
  if (data.chatLog) {
    let container = $('#container')
    container.html(data.chatLog)
    container.animate({ scrollTop: container.prop("scrollHeight")}, 1000)
  }
  if (data.chatId) {
    sessionStorage.setItem(CHAT_ID, data.chatId)
  }
}

function displayUserMessages(id, name) {
  let messages = $('#user-messages')

  $.get('/posts/' + id, (data) => {
    $('.modal-title').text(name + '\'s posts')

    console.log(id)
    $('.modal-body').html(data
      .map((elem) => {
        return '<div><em> On ' + elem.timestamp + ':</em><p>' + elem.text + '</p></div>'
      })
      .join(''))
    console.log(data)
    messages.modal('show')
  })
}

function sendMessage(e) {
  let input = $('#message-input')
  let messageText = input.val()

  if (messageText.trim() === '') {
    return
  }

  $.post('https://www.googleapis.com/youtube/v3/liveChat/messages', {
    snippet: {
      type: 'textMessageEvent',
      liveChatId: sessionStorage.getItem(CHAT_ID),
      textMessageDetails: {
        messageText: messageText
      }
    }
  })
  .done(() => {
    input.val('')

    let button = $('#message-send')
    input.prop('disabled', true)
    button.prop('disabled', true)

    setTimeout(() => {
      input.prop('disabled', false)
      button.prop('disabled', false)
      input.focus()
    }, 500)
  })
}

function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  var profile = googleUser.getBasicProfile();
  console.log(googleUser.getAuthResponse(true))

  let userData = {
    name: profile.getName(),
    id: profile.getEmail(),
    image: profile.getImageUrl()
  }

  sessionStorage.setItem(USER, JSON.stringify(userData))

  $.post('/join', userData)
    .done((data) => {
        $('#content').html(data)

        let container = $('#container')
        container.animate({ scrollTop: container.prop("scrollHeight")}, 1000)

        $('#message-send').click(sendMessage)
        $('#message-input').on('keydown', (e) => {
          // send on enter key
          if (e.keyCode === 13) {
            sendMessage(e)
          }
        })

        function setupWebSocket () {
          this.ws = new WebSocket('ws://' + window.location.host + '/register/' + userData.id)
          this.ws.onmessage = handleMessage
          this.ws.onclose = () => {
            setTimeout(setupWebSocket, 1000);
          }
        }
        setupWebSocket()
      })
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance()
  auth2.signOut().then(() => {
    if (sessionStorage.getItem(USER)) {
      $.ajax({
        type: 'DELETE',
        url: '/leave/' + JSON.parse(sessionStorage.getItem(USER)).id
      })
    }

    sessionStorage.removeItem(CHAT_ID)
    sessionStorage.removeItem(USER)
    console.log('User signed out.')
  })
}
