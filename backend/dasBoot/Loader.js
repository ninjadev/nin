var Loader = (function(){
  var eventNames = {
    AUDIO: 'canplaythrough',
    IMG: 'load'
  };
  var itemsToAjax = [];
  var itemsToLoad = [];
  return {
    loadAjax: function(filepath, callback) {
      itemsToAjax.push({
        filepath: filepath,
        callback: callback
      });
    },
    load: function(filepath, element, callback) {
      console.log('starting to load', filepath);
      itemsToLoad.push({
        filepath: filepath,
        element: element,
        callback: callback
      });
    },
    start: function(onprogress, oncomplete) {
      var maxWaitingCount = itemsToAjax.length + itemsToLoad.length;
      var waitingCount = maxWaitingCount;
      function registerAsLoaded(item) {
        onprogress(100 - waitingCount / maxWaitingCount * 100);
        console.log('finished loading', item.filepath);
        if(!--waitingCount) {
          oncomplete();  
        }
      }
      itemsToLoad.forEach(function(item) {
        var eventName = eventNames[item.element.tagName];
        item.element.addEventListener(eventName, function() {
          item.callback && item.callback(); 
          registerAsLoaded(item); 
        });
        item.element.src = item.filepath;
      });
      itemsToAjax.forEach(function(item) {
        var response = null;
        var request = new XMLHttpRequest();
        request.open('GET', item.filepath, 1);
        request.onload = function() {
          item.callback(request.responseText);
          registerAsLoaded(item);
        }
        request.send();
      });
    }
  };
})();
