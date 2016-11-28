const angular = require('angular');

const demo = require('./demo');
const graphEditor = require('./graphEditor');
const waveform = require('./waveform');
const menubar = require('./menubar');
const dragresizable = require('./dragresizable');
const scrollcallback = require('./scrollcallback');
const selectOnClick = require('./selectOnClick');
const ngRightClick = require('./ngRightClick');

module.exports = angular.module('nin.directives', [])
                   .directive('demo', demo)
                   .directive('graphEditor', graphEditor)
                   .directive('waveform', waveform)
                   .directive('menubar', menubar)
                   .directive('dragresizable', dragresizable)
                   .directive('scrollcallback', scrollcallback)
                   .directive('selectOnClick', selectOnClick)
                   .directive('ngRightClick', ngRightClick)
                   .name;

