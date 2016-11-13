function ninrc($http) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', '.ninrc', false);
  xhr.send(null);

  return JSON.parse(xhr.responseText);
}

module.exports = ninrc;
