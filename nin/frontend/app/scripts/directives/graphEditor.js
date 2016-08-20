(function() {
  'use strict';

  angular.module('nin').directive('graphEditor', function($window, $timeout, demo, socket) {
    return {
      restrict: 'A',
      templateUrl: 'views/graph-editor.html',
      link: function($scope, element, attrs) {
        let stored = localStorage.getItem('nin-nodemeta');
        let nodeCache = stored && JSON.parse(stored) || {};

        function getFor(id) {
          if (!nodeCache[id]) {
            nodeCache[id] = {
              x: 0,
              y: 0
            };
          }

          return nodeCache[id];
        }

        function persistNodeMeta() {
          localStorage.setItem('nin-nodemeta', JSON.stringify(nodeCache));
        }

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

          for (let nodeInfo of $scope.graph) {
            var node = demo.nm.nodes[nodeInfo.id];
            var nodeMeta = getFor(nodeInfo.id);

            var outputOrdering = Object.keys(node.outputs).sort();
            outputOrdering.reverse();

            for(var outputName in nodeInfo.connectedTo) {
              var toNodeName = nodeInfo.connectedTo[outputName].split('.')[0];
              var toNodeInputName = nodeInfo.connectedTo[outputName].split('.')[1];
              var toNode = demo.nm.nodes[toNodeName];
              var toNodeMeta = getFor(toNodeName);

              var inputOrdering = Object.keys(toNode.inputs).sort();

              var fromX = (nodeMeta.x + 100 -
                           20 * outputOrdering.indexOf(outputName) - 10);
              var fromY = nodeMeta.y + 100;
              var toX = (toNodeMeta.x +
                         20 * inputOrdering.indexOf(toNodeInputName) + 10);
              var toY = toNodeMeta.y;

              drawManhattanLine(nodeLineSVG, fromX, fromY, toX, toY);
            }
          }
        }

        function renderSVG() {
          /* delete old SVG */
          element[0].innerHTML = '';

          /* early exits */
          if (!($scope.graph && demo.nm.nodes)) {
            return;
          }

          baseSVG = $window.SVG(element[0]);
          nodeLineSVG = baseSVG.nested();
          var i = 0;
          for (var nodeName in demo.nm.nodes) {
            var node = demo.nm.nodes[nodeName];
            var nodeGroup = baseSVG.group();
            var nodeMeta = getFor(node.id);

            nodeGroup.attr({
              class: 'node' 
            }).transform({
              x: nodeMeta.x,
              y: nodeMeta.y
            }).draggable({
            }).on('dragstart', (function(nodeMeta, nodeGroup) {
              return function(e) {
                /* since e.detail.p includes an offset from the top left corner
                 * of the node, we need to cache it here in order to compensate
                 * for it in dragmove */
                nodeMeta.dragStartX = (nodeGroup.transform().x - e.detail.p.x);
                nodeMeta.dragStartY = (nodeGroup.transform().y - e.detail.p.y);
              };
            })(nodeMeta, nodeGroup)).on('dragmove', (function(nodeMeta) {
              return function(e) {
                /* populate _graphEditorInfo so that coordinates are always
                 * readily available for e.g. drawing connections */
                nodeMeta.x = (nodeMeta.dragStartX + e.detail.p.x);
                nodeMeta.y = (nodeMeta.dragStartY + e.detail.p.y);
                redrawNodeLines();
              };
            })(nodeMeta)).on('dragend', persistNodeMeta);

            nodeGroup.rect(100, 100).attr({
              class: 'background',
              opacity: 0.5 + 0.5 * node.active || false
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
