var fs = require('fs');
var zlib = require('zlib');
var crc = require('crc').crc32;

function positiveNumberToBytes(number, bytes) {
  bytes = bytes || 4;
  var result = '';
  for(var i = 0; i < bytes; i++){
    result = String.fromCharCode(number % 256) + result;
    number = number / 256 | 0;
  }
  return result;
}

function chunk(type, data) {
  var length = positiveNumberToBytes(data.length, 4);
  return Buffer.concat([
      new Buffer(length, 'binary'),
      new Buffer(type + data, 'binary'),
      new Buffer(positiveNumberToBytes(+('0x' + crc(type + data)), 4), 'binary')
  ]);
}


function compress(payload, callback) {

  while(payload.length % 3) {
    payload += ' ';  
  }

  var width = Math.ceil(Math.sqrt(payload.length / 3));
  var height = width;
  var padding = width * height - payload.length / 3;

  while(padding --> 0) {
    payload += '   ';
  }

  var fileSignature = new Buffer('\x89\x50\x4e\x47\x0d\x0a\x1a\x0a', 'binary');
  var IHDRChunk = chunk('IHDR', 
    positiveNumberToBytes(width, 4) +
    positiveNumberToBytes(height, 4) +
    positiveNumberToBytes(8, 1) +
    positiveNumberToBytes(2, 1) +
    positiveNumberToBytes(0, 1) +
    positiveNumberToBytes(0, 1) +
    positiveNumberToBytes(0, 1));
  var html = '<!DOCTYPE html><meta charset="utf-8">' +
    '<head><title>Ninjadev</title><style>button{border:0;outline:0;margin:40px auto;background: black;}.small{font-size:20px}*{font-family:sans-serif;display:none}.visible, .visible *{display:block}.loading{width:600px;left:50%;margin-left:-340px;position:absolute;z-index:9999999999;color:white;font-size: 40px;text-align:center; padding: 20px}html,body{display:block;overflow:hidden;background:#000;padding:0;margin:0;border:0;outline:0;}canvas{position:fixed;display:block;background:#000;}.hide{display:none}</style></head>' +
    '<body>' +
    '<div class="loading visible">' +
    '<p>Inakuwa Oasis</p>' +
    '<p class=small>by</p>' +
    '<p>Ninjadev</p>' +
    '<p class=small>The inaugural demo of our new demo tool \'nin\' (open source!).</p>' +
    '<p class=small>Presented at Solskogen 2014.</p>' +
    '<button onclick=start() class=loading style="position:relative;font-size:40px;color:white;padding:40px;margin-left:-300px;border:0;outline:0;" id=start-button disabled>Loading...</button>' +
    '</div>' +
    '<script>' +
    'function z(){' +
      'x=document.querySelector("canvas").getContext("2d");' +
      'x.drawImage(document.querySelector("img"),0,0);' +
      'd=x.getImageData(0,0,' + width + ' ,' + height + ').data;' +
      's="";' +
      'for(i=0;i<d.length;i+=4){' +
        's+=String.fromCharCode(d[i]);' +
        's+=String.fromCharCode(d[i+1]);' +
        's+=String.fromCharCode(d[i+2]);' +
      '}' +
      's=s.replace(/\\0/g, " ");' +
      '(1,eval)(s);' +
      'var layers = JSON.parse(atob(FILES["res/layers.json"]));' +
      'var camerapaths = JSON.parse(atob(FILES["res/camerapaths.json"]));' +
      'demo=bootstrap({layers:layers, camerapaths:camerapaths, onprogress: function(percent){}, oncomplete: function(){ var el=document.querySelector("#start-button");el.style.cursor="pointer";el.disabled = false;el.innerText = "Start"; document.querySelector("button").style.background = "white"; document.querySelector("button").style.color="black"; } });' +
      
      'start=function(){' +
      'var opacity = 1;' +
      'function fadeOut(){' +
        'document.querySelector(".visible").style.opacity = opacity;' +
        'console.log(opacity, document.querySelector(".visible").style.opacity);' + 
         'if(opacity > 0) {' +
           'opacity -= 0.005;' +
           'setTimeout(fadeOut, 10);' +
         '} else {' +
          'document.querySelector(".visible").classList.remove("visible");' +
         '}' +
      '}' +
      'fadeOut();' +
      'demo.start();' +
      '}' +
    '}</script><canvas class=hide height='+ height + ' width=' + width + '></canvas><img src=# onload=z()><!--';
  var htMlChunk = chunk('htMl', html);
  var IENDChunk = chunk('IEND', '');

  var scanlines = payload.match(new RegExp('[\\s\\S]{1,' + (width * 3) + '}', 'g'));
  var scanlinesBuffer = Buffer.concat(scanlines.map(function(scanline){
    return new Buffer('\0' + scanline, 'binary');
  }));

  zlib.deflate(scanlinesBuffer.toString('binary'), function(err, buffer){
    var IDATData = Buffer.concat([
      buffer,
      new Buffer(positiveNumberToBytes(+('0x' + crc(scanlinesBuffer.toString('binary'))), 4), 'binary')
    ]);
    var IDATChunk = chunk('IDAT', IDATData.toString('binary'));
    callback(Buffer.concat([
      fileSignature,
      IHDRChunk,
      htMlChunk,
      IDATChunk,
      IENDChunk
    ]));
  });
}


module.exports['compress'] = compress;
