"use strict";

var chokidar = require('chokidar');
var express = require('express');
var fs = require('fs');

var path = process.argv[2] || '';

var fullpath = __dirname + '/' + path;



var connect = require('connect');

connect.createServer(
    connect.static(__dirname + '/public/')
).listen(8000);

connect.createServer(
    connect.static(__dirname + '/' + path)
).listen(9999);


var http = require('http');
var sockjs = require('sockjs');

var c;

var echo = sockjs.createServer();
echo.on('connection', function(conn) {

    console.log('connected!');

    var watcher = chokidar.watch(fullpath, {ignored: 
        /(\/bin\/|mp3$|ogg$|png$|swp$|md$)/ , persistent: true});
    watcher
    .on('add', function(path) {
        console.log('File', path, 'has been added');
        c && c.write(JSON.stringify({type:'add', path: path.slice(fullpath.length)}));
    })
    .on('change', function(path) {
        console.log('File', path, 'has been changed');
        c && c.write(JSON.stringify({type:'change', path: path.slice(fullpath.length)}));
    })
    .on('unlink', function(path) {console.log('File', path, 'has been removed');})
    .on('error', function(error) {console.error('Error happened', error);})

    c = conn;

    conn.on('data', function(message) {
        var json = JSON.parse(message);
        if(json.type == 'layer') {
            fs.readFile(path + '/res/layers.json',
                                     'utf8', function(err, data) {
            var layers = JSON.parse(data);
            console.log(layers, json);
            layers[+json.index].start = json.start;
            layers[+json.index].end = json.end;
            fs.writeFile(path + '/res/layers.json', JSON.stringify(layers, null, 4));
            });
        }
        if(json.type == 'layer options') {
            fs.readFile(path + '/res/layers.json',
                                     'utf8', function(err, data) {
            var layers = JSON.parse(data);
            console.log(layers, json);
            layers[+json.index].options = json.options
            fs.writeFile(path + '/res/layers.json', JSON.stringify(layers, null, 4));
            });
        }
    });

    conn.on('close', function() {});
});

var server = http.createServer();
echo.installHandlers(server, {prefix:'/sockjs'});
server.listen(8080, '0.0.0.0');
