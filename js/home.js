const USER = 'user'
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

$(document).ready(function () {
  window.addEventListener("beforeunload", signOut)
});

var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('chat-view', {
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady() {
    console.log("hey Im ready");

function onPlayerStateChange() {
  console.log("my state changed");
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

function showUserMessages(e) {
    let userName = $(e.target).text()

    let data = _.map(
    _.filter($('yt-live-chat-text-message-renderer div[id="content"]'), (element) => {
      return $(element).find('span[id="author-name"]').text() === userName
    }),
    (element) => {
        let _element = $(element)

        return {
          message: _element.find('span[id="message"]').text(),
          timestamp: _element.find('span[id="timestamp"]').text()
        }
    })

    console.log(data)
}

function setClickHandler() {
  var iframe = document.getElementById("chat-view");
   var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
   console.log(innerDoc.body);
    $('#chat').on('click', 'span[id="author-name"]', showUserMessages)
}

function updateVideo() {
  $.get('/setvideo', data => {
    $('#video-view').attr('src', `https://www.youtube.com/embed/${data}?autoplay=1`)
    $('#chat-view').attr('src', `https://www.youtube.com/live_chat?v=${data}&embed_domain=${document.domain}`)
  })
}

function onSignIn(googleUser) {
  // Useful data for your client-side scripts:
  sessionStorage.setItem(USER, googleUser.getBasicProfile())

  updateVideo()
  $('#random-button').click(updateVideo)

  $('#main').show()
  $('#random-button').show()
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance()
  auth2.signOut()

  sessionStorage.removeItem(USER)
  console.log('User signed out.')
}
