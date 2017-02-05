const SVG = require('svg.js');
require('svg.draggable.js');
const React = require('react');
const ReactDOM = require('react-dom');
const GraphEditor = require('./editor/GraphEditor');

const e = React.createElement;



function graphEditor($window, $timeout, demo, socket) {
  return {
    restrict: 'A',
    templateUrl: 'views/graph-editor.html',
    link: function($scope, element, attrs) {
      $scope.$watch('graph', () => {
        const editor = e(GraphEditor, {graph: $scope.graph, nodes: demo.nm.nodes, demo: demo});
        ReactDOM.render(editor, element[0]);
      });
    },
    scope: {
      graph: '='
    }
  };
}

module.exports = graphEditor;
