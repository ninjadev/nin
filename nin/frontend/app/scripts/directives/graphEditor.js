(function() {
  'use strict';

  angular.module('nin').directive('graphEditor', function($window, $timeout, demo, socket) {
    return {
      restrict: 'A',
      templateUrl: 'views/graph-editor.html',
      link: function($scope, element, attrs) {

        demo.nm.onGraphChange(renderSVG);
        $scope.$watch('graph', renderSVG);

        var panZoom;

        var selectedItem = null;
        var selectedSVGItem = null;

        function select(item, svgItem) {
          demo.renderer.overrideToScreenTexture = null;
          selectedItem = item;
          if(selectedSVGItem) {
            selectedSVGItem.removeClass('selected');
          }
          selectedSVGItem = svgItem;
          selectedSVGItem.addClass('selected');
          if(selectedItem.getValue() instanceof THREE.Texture) {
            demo.renderer.overrideToScreenTexture = selectedItem.getValue();
          }
        }

        function calculateSize() {
          $scope.width = $window.innerWidth;
          $scope.height = $window.innerHeight - 50 - 30 - 10;
          if(panZoom) {
            panZoom.resize();
          }
        }
        $window.addEventListener('resize', function() {
          calculateSize();
        });
        calculateSize();

        var baseSVG;
        var nodeLineSVG;

        function drawManhattanLine(container, fromX, fromY, toX, toY) {
          var path;
          if(fromY < toY) {
            path = [
              [fromX, fromY],
              [fromX, fromY + (toY - fromY) / 4],
              [toX, fromY + (toY- fromY) / 4 * 3],
              [toX, toY]
            ];
          } else {
            path = [
              [fromX, fromY],
              [fromX + (toX - fromX) / 4, fromY],
              [fromX + (toX - fromX) / 4 * 3, toY],
              [toX, toY]
            ];
          }
          nodeLineSVG.polyline(path).fill('none').stroke({
            width: 1  
          });
        }

        function redrawNodeLines() {
          var newNodeLineSVG = baseSVG.nested().attr({
            class: 'connection-lines' 
          });
          nodeLineSVG.replace(newNodeLineSVG);
          nodeLineSVG = newNodeLineSVG;
          for(var i = 0; i < $scope.graph.length; i++) {
            var nodeInfo = $scope.graph[i];
            var node = demo.nm.nodes[nodeInfo.id];
            var outputOrdering = Object.keys(node.outputs).sort();
            outputOrdering.reverse();
            for(var outputName in nodeInfo.connectedTo) {
              var toNodeName = nodeInfo.connectedTo[outputName].split('.')[0];
              var toNodeInputName = nodeInfo.connectedTo[outputName].split('.')[1];
              var toNode = demo.nm.nodes[toNodeName];
              var inputOrdering = Object.keys(toNode.inputs).sort();
              var fromX = (node._graphEditorInfo.x + 100 -
                           20 * outputOrdering.indexOf(outputName) - 10);
              var fromY = node._graphEditorInfo.y + 100;
              var toX = (toNode._graphEditorInfo.x +
                         20 * inputOrdering.indexOf(toNodeInputName) + 10);
              var toY = toNode._graphEditorInfo.y;
              drawManhattanLine(nodeLineSVG, fromX, fromY, toX, toY);
            }
          }
        }

        function renderSVG() {

          /* delete old SVG */
          element[0].innerHTML = '';

          /* early exits */
          if(!$scope.graph) {
            return;
          }
          if(!demo.nm.nodes) {
            return;
          }

          /* preprocess the NodeManager's nodes by
           * bundling stored information from graph.json */
          for(var i = 0; i < $scope.graph.length; i++) {
            var nodeInfo = $scope.graph[i];
            var node = demo.nm.nodes[nodeInfo.id];
            node._graphEditorInfo = node._graphEditorInfo || {};
            node._graphEditorInfo.x = nodeInfo.x || 0;
            node._graphEditorInfo.y = nodeInfo.y || 0;
          }

          baseSVG = $window.SVG(element[0]);
          nodeLineSVG = baseSVG.nested();
          var i = 0;
          for(var nodeName in demo.nm.nodes) {
            var node = demo.nm.nodes[nodeName];
            var nodeGroup = baseSVG.group();
            nodeGroup.attr({
              class: 'node' 
            }).transform({
              x: node._graphEditorInfo.x,
              y: node._graphEditorInfo.y,
            }).draggable({
            }).on('dragstart', (function(node, nodeGroup) {
              return function(e) {
                /* since e.detail.p includes an offset from the top left corner
                 * of the node, we need to cache it here in order to compensate
                 * for it in dragmove */
                node._graphEditorInfo.dragStartX = (nodeGroup.transform().x -
                                                    e.detail.p.x);
                node._graphEditorInfo.dragStartY = (nodeGroup.transform().y -
                                                    e.detail.p.y);
              };
            })(node, nodeGroup)).on('dragmove', (function(node) {
              return function(e) {
                /* populate _graphEditorInfo so that coordinates are always
                 * readily available for e.g. drawing connections */
                node._graphEditorInfo.x = (node._graphEditorInfo.dragStartX +
                                           e.detail.p.x);
                node._graphEditorInfo.y = (node._graphEditorInfo.dragStartY +
                                           e.detail.p.y);
                redrawNodeLines();
              };
            })(node)).on('dragend', (function(node) {
              return function(e) {
                socket.sendEvent('set', {
                  id: node.id,
                  fields: {
                    x: node._graphEditorInfo.x,
                    y: node._graphEditorInfo.y
                  }
                });
              };
            })(node));
            nodeGroup.rect(100, 100).attr({
              class: 'background',
              opacity: 0.5 + 0.5 * node._graphEditorInfo.active || false
            });
            nodeGroup.plain(nodeName).attr({
              x: 50,
              y: 50,
              class: 'name'
            });

            var j = 0;
            var sortedKeys = Object.keys(node.inputs).sort();
            for(var i in sortedKeys) {
              var inputName = sortedKeys[i];
              var input = node.inputs[inputName]; 
              var inputGroup = nodeGroup.group();
              inputGroup.attr({
                class: 'input' 
              }).transform({
                x: 25 * j
              }).on('click', (function(input, inputGroup) {
                return function() {
                  select(input, inputGroup);
                };
              })(input, inputGroup));
              var inputBg = inputGroup.rect(25, 25);
              inputGroup.plain(inputName).attr({
                x: 12.5,
                y: 12.5
              });
              j++;
            }
            j = 0;
            var sortedKeys = Object.keys(node.outputs).sort();
            sortedKeys.reverse();
            for(var i in sortedKeys) {
              var outputName = sortedKeys[i];
              var output = node.outputs[outputName]; 
              var outputGroup = nodeGroup.group();
              outputGroup.attr({
                class: 'output' 
              }).transform({
                x: 75 - 25 * j,
                y: 75
              }).on('click', (function(output, outputGroup) {
                return function() {
                  select(output, outputGroup);
                };
              })(output, outputGroup));
              outputGroup.rect(25, 25);
              outputGroup.plain(outputName).attr({
                x: 12.5,
                y: 12.5
              });
              j++;
            }
            i++;
          }

          redrawNodeLines();

          panZoom = $window.svgPanZoom(element.find('svg')[0], {
            zoomScaleSensitivity: 0.3,
            minZoom: 0.1,
            maxZoom: 100,
            fit: false,
            contain: false,
            center: false,
            refreshRate: 'auto'
          });
          panZoom.resize();
          panZoom.updateBBox();
          panZoom.center();
        }
      },
      scope: {
        graph: '='
      }
    };
  });
})();
