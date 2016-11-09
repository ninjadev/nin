const SVG = require('svg.js');
require('svg.draggable.js');
const svgPanZoom = require('svg-pan-zoom');

function graphEditor($window, $timeout, demo, socket) {
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

      function generateDepths() {
        let deepestLevel = 0;
        let depths = {};
        let seen = new Set();

        function recurse(level, currentNodes) {
          let nextLevel = [];
          deepestLevel = Math.max(deepestLevel, level);

          for (let i=0; i<currentNodes.length; i++) {
            let node = currentNodes[i];
            seen.add(node.id);
            depths[node.id] = {
              y: level,
              x: i
            };

            for (let child in node.inputs) {
              let source = node.inputs[child].source;
              if (source && !seen.has(source.node.id)) {
                seen.add(source.node.id);
                nextLevel.push(source.node);
              }
            }
          }

          if (nextLevel.length) {
            recurse(level + 1, nextLevel);
          }
        }

        recurse(0, [demo.nm.nodes.root]);

        let offset = 0;
        for (let nodeId in demo.nm.nodes) {
          if (depths[nodeId] === undefined) {
            depths[nodeId] = {
              y: deepestLevel + 1,
              x: offset
            };

            offset += 1;
          }

          depths[nodeId].x *= 200;
          depths[nodeId].y *= -200;
        }

        return depths;
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
        let depths = generateDepths();

        for (let nodeInfo of $scope.graph) {
          var node = demo.nm.nodes[nodeInfo.id];

          var outputOrdering = Object.keys(node.outputs).sort();
          outputOrdering.reverse();

          for(var outputName in nodeInfo.connectedTo) {
            var toNodeName = nodeInfo.connectedTo[outputName].split('.')[0];
            var toNodeInputName = nodeInfo.connectedTo[outputName].split('.')[1];
            var toNode = demo.nm.nodes[toNodeName];

            var inputOrdering = Object.keys(toNode.inputs).sort();

            var fromX = (depths[nodeInfo.id].x + 100 -
                         20 * outputOrdering.indexOf(outputName) - 10);
            var fromY = depths[nodeInfo.id].y + 100;
            var toX = (depths[toNodeName].x +
                       20 * inputOrdering.indexOf(toNodeInputName) + 10);
            var toY = depths[toNodeName].y;

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

        baseSVG = SVG(element[0]);
        let depths = generateDepths();

        nodeLineSVG = baseSVG.nested();
        var i = 0;
        for (var nodeName in demo.nm.nodes) {
          var node = demo.nm.nodes[nodeName];
          var nodeGroup = baseSVG.group();

          nodeGroup.attr({
            class: 'node'
          }).transform({
            x: depths[node.id].x,
            y: depths[node.id].y
          });

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

        panZoom = svgPanZoom(element.find('svg')[0], {
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

        panZoom.zoom(localStorage.getItem('graph-scale') || '1.0');
        let pan = localStorage.getItem('graph-pan');
        if (pan) { panZoom.pan(JSON.parse(pan)); }

        panZoom.setOnPan(
            pan => localStorage.setItem('graph-pan', JSON.stringify(pan)));
        panZoom.setOnZoom(
            scale => localStorage.setItem('graph-scale', scale));
      }
    },
    scope: {
      graph: '='
    }
  };
}

module.exports = graphEditor;
