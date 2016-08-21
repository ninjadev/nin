const angular = require('angular');

const errorExcerpt = require('./errorExcerpt');
const stackFormat = require('./stackFormat');

module.exports = angular.module('nin.filters', [])
                   .filter('errorExcerpt', errorExcerpt)
                   .filter('stackFormat', stackFormat)
                   .name;
