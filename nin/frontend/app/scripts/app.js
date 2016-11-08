const $ = require('jquery');
window.$ = $;
window.jQuery = $;
const angular = require('angular');

const controllers = require('./controllers');
const services = require('./services');
const directives = require('./directives');
const filters = require('./filters');

require('jquery-ui/themes/base/all.css');

angular
  .module('nin', [
    require('angular-ui-bootstrap'),
    require('angular-ui-layout'),
    services,
    controllers,
    directives,
    filters
  ]);
