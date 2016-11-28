const angular = require('angular');

const socket = require('./socket');
const demo = require('./demo');
const commands = require('./commands');
const camera = require('./camera');
const ScriptReloader = require('./ScriptReloader');
const render = require('./render');
const ninrc = require('./ninrc');

module.exports = angular.module('nin.services', [])
                   .factory('socket', socket)
                   .factory('demo', demo)
                   .factory('camera', camera)
                   .service('ScriptReloader', ScriptReloader)
                   .service('commands', commands)
                   .service('render', render)
                   .service('ninrc', ninrc)
                   .name;
