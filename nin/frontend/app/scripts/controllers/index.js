const angular = require('angular');

const MainCtrl = require('./main');
const TopCtrl = require('./top');
const BottomCtrl = require('./bottom');

module.exports = angular.module('nin.controllers', [])
                   .controller('MainCtrl', MainCtrl)
                   .controller('TopCtrl', TopCtrl)
                   .controller('BottomCtrl', BottomCtrl)
                   .name;
