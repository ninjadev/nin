let crc = require('crc').crc32;
let zopfli = require('node-zopfli');


function positiveNumberToBytes(number, bytes) {
  bytes = bytes || 4;
  let result = [];
  for(let i = 0; i < bytes; i++){
    result = [number % 256].concat(result);
    number = number / 256 | 0;
  }
  return new Buffer(result);
}

function chunk(type, data) {
  let length = positiveNumberToBytes(data.length, 4);
  let typeAndData = Buffer.concat([new Buffer(type, 'binary'), data]);
  return Buffer.concat([
    length,
    typeAndData,
    positiveNumberToBytes(crc(typeAndData), 4)
  ]);
}

async function compress(projectPath, payload, htmlPreamble, metadata) {

  payload = new Buffer(payload, 'binary');

  while(payload.length % 3) {
    payload = Buffer.concat([payload, new Buffer([0])]);
  }

  let width = Math.ceil(Math.sqrt(payload.length / 3));
  let height = width;
  let padding = width * height - payload.length / 3;

  while(padding --> 0) {
    payload = Buffer.concat([payload, new Buffer([0, 0, 0])]);
  }

  let fileSignature = new Buffer('\x89\x50\x4e\x47\x0d\x0a\x1a\x0a', 'binary');
  let IHDRChunk = chunk('IHDR', Buffer.concat([
    positiveNumberToBytes(width, 4),
    positiveNumberToBytes(height, 4),
    positiveNumberToBytes(8, 1),
    positiveNumberToBytes(2, 1),
    positiveNumberToBytes(0, 1),
    positiveNumberToBytes(0, 1),
    positiveNumberToBytes(0, 1)
  ]));

  let html =
    htmlPreamble +
    '<script>' +
    'function z(){' +
      'x=document.querySelector("canvas").getContext("2d");' +
      'x.drawImage(document.querySelector("img"),0,0);' +
      'd=x.getImageData(0,0,' + width + ' ,' + height + ').data;' +
      's="";' +
      'var buf=[];' +
      'var stride = 1000000;' +
      'console.log("total length", d.length);' +
      'l(0);' +
      'function l(offset) {' +
        'console.log("L", offset);' +
        'ONPROGRESS && ONPROGRESS(offset/d.length*80);' +
        'for(i=offset;i < offset + stride && i<d.length;i+=4){' +
          'buf.push(String.fromCharCode(d[i]));' +
          'buf.push(String.fromCharCode(d[i+1]));' +
          'buf.push(String.fromCharCode(d[i+2]));' +
        '}' +
        'if(offset < d.length) {' +
          'setTimeout(function(){l(offset + stride);}, 0);' +
        '} else {' +
          's=buf.join("").replace(/\\0/g, " ");' +
          'GU=1;' + /* hack to make sure GU exisits from the get-go */
          'BEAN=0;' +
          'BEAT=false;' +
          '(1,eval)(s);' +
          'var graph = JSON.parse(atob(FILES["res/graph.json"]));' +
          'demo=bootstrap({graph:graph, onprogress: ONPROGRESS, oncomplete: ONCOMPLETE});' +
        '}' +
      '}' +
    '}</script>' +
    '<canvas class=hide height='+ height + ' width=' + width + '></canvas><img src=# onload=z()><!--';


  let metadataChunks = Buffer.concat(
    Object.keys(metadata)
      .map(key => chunk('tEXt', new Buffer(key + '\0' + metadata[key])))
  );
  let htMlChunk = chunk('htMl', new Buffer(html));
  let IENDChunk = chunk('IEND', new Buffer(''));

  /* http://stackoverflow.com/a/11764168 */
  function bufferChunk (buffer, len) {
    let chunks = [], i = 0, n = buffer.length;
    while (i < n) { chunks.push(buffer.slice(i, i += len)); }
    return chunks;
  }

  let scanlines = bufferChunk(payload, width * 3);
  let scanlinesBuffer = Buffer.concat(scanlines.map(function(scanline) {
    return Buffer.concat([new Buffer([0]), scanline]);
  }));

  return new Promise(resolve => {
    zopfli.zlib(scanlinesBuffer, {}, function(err, buffer){
      let IDATData = Buffer.concat([
        buffer,
        positiveNumberToBytes(crc(scanlinesBuffer), 4)
      ]);
      let IDATChunk = chunk('IDAT', IDATData);
      resolve(Buffer.concat([
        fileSignature,
        IHDRChunk,
        metadataChunks,
        htMlChunk,
        IDATChunk,
        IENDChunk
      ]));
    });
  });
}


module.exports['compress'] = compress;
