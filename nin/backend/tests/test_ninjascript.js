var ninjascript = require('../ninjascript');
var fs = require('fs');

var source = fs.readFileSync('tests/TestLayer.n', 'utf8');
var expected = fs.readFileSync('tests/TestLayer.js', 'utf8');
var compiled = ninjascript.compile('TestLayer', source);

if(expected != compiled) {
  console.log(compiled);
  console.error('Fail!');
  process.exit(1);
}

console.log('Pass!');
