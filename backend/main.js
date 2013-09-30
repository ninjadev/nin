"use strict";

var chokidar = require('chokidar');
var express = require('express');

var path = process.argv[2] || '';

var watcher = chokidar.watch( __dirname + '/' + path, {ignored: /^\./, persistent: true});

/*
watcher
.on('add', function(path) {console.log('File', path, 'has been added');})
.on('change', function(path) {console.log('File', path, 'has been changed');})
.on('unlink', function(path) {console.log('File', path, 'has been removed');})
.on('error', function(error) {console.error('Error happened', error);})
*/

var connect = require('connect');

connect.createServer(
    connect.static(__dirname + '/public/')
).listen(8000);

connect.createServer(
    connect.static(__dirname + '/' + path)
).listen(9999);
