const xhr = new XMLHttpRequest();
xhr.open('GET', '.ninrc', false);
xhr.send(null);

module.exports = JSON.parse(xhr.responseText);
