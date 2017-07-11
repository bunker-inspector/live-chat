const USER = 'user'

$(document).ready(function () {
  window.addEventListener("beforeunload", signOut)
});

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

function updateVideo(data) {
  $('#video-view').attr('src', `https://www.youtube.com/embed/${data}?autoplay=1`)
  $('#chat-view').attr('src', `https://www.youtube.com/live_chat?v=${data}&embed_domain=${document.domain}`)
}

function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  sessionStorage.setItem(USER, googleUser.getBasicProfile())

  $.get('/setvideo', updateVideo)
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance()
  auth2.signOut()

  sessionStorage.removeItem(USER)
  console.log('User signed out.')
}
