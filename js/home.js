$(document).ready(function () {
  const dataView = $('#data-view')

  dataView.hide()

  $.get('http://localhost:8080/data', (data) => {
      dataView.text(JSON.stringify(data, null, 2))
  });

  $('#data-disp-btn').click((e) => { dataView.toggle() })
  $('#data-dnld-btn').click((e) => {
    e.preventDefault()
    window.location.href = 'http://localhost:8080/download'
  })
});
