const USER = 'user'
const SOCKET = 'socket'

$(document).ready(function () {
  window.addEventListener("beforeunload", signOut)
});

function displayUserMessages(id, name) {
  let messages = $('#user-messages')

  $.get('/posts/' + id, (data) => {
    $('.modal-title').text(name + '\'s posts')

    $('.modal-body').html(data
      .map((elem) => {
        return '<div><em> On ' + elem.timestamp + ':</em><p>' + elem.text + '</p></div>'
      })
      .join(''))

    messages.modal('show')
  })
}

function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  var profile = googleUser.getBasicProfile();

  let userData = {
    name: profile.getName(),
    id: profile.getId(),
    image: profile.getImageUrl()
  }

  sessionStorage.setItem(USER, userData)

  $.post('/join', userData)
    .done((data) => {
        $('#content').html(data)

        const updateSocket = new WebSocket('ws://localhost:8080/register/' + userData.id)
        updateSocket.onmessage = (event) => {
            $('#container').html(event.data)
        }

        sessionStorage.setItem(SOCKET, updateSocket)
      })
}

function signOut() {


  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(() => {

    let updateSocket = sessionStorage.getItem(SOCKET) || { close: () => {}}
    updateSocket.close()
    sessionStorage.removeItem(SOCKET)

    $.delete('/leave/' + sessionStorage.getItem(USER).id)

    sessionStorage.removeItem(USER)
    console.log('User signed out.')
  })
}
