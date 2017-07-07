const USER = 'user'
const SOCKET = 'socket'

$(document).ready(function () {
  window.addEventListener("beforeunload", signOut)
});

function displayUserMessages(id, name) {
  let messages = $('#user-messages')

  console.log(id)

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
  let userData = JSON.parse(sessionStorage.getItem(USER))

  let currentdate = new Date();
  let datetime =  currentdate.getHours() + ':'
                + currentdate.getMinutes() + ':'
                + currentdate.getSeconds() + ' '
                + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear()
  $.post('/new-message', {
    timestamp: datetime,
    user: userData.name,
    uid: userData.id,
    image: userData.image,
    text: messageText
  })
  .done(() => { input.val('') })
}

function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  var profile = googleUser.getBasicProfile();

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

        const updateSocket = new WebSocket('ws://' + window.location.host + '/register/' + userData.id)
        updateSocket.onmessage = (event) => {

          container.html(event.data)
          container.animate({ scrollTop: container.prop("scrollHeight")}, 1000)
        }

        sessionStorage.setItem(SOCKET, updateSocket)
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

    sessionStorage.removeItem(SOCKET)
    sessionStorage.removeItem(USER)
    console.log('User signed out.')
  })
}
