var Loader = (function(){
  var eventNames = {
    AUDIO: 'canplaythrough',
    IMG: 'load'
  };
  var itemsToAjax = [];
  var itemsToLoad = [];
  var rootPath = '';
  return {
    setRootPath: function(path){
      rootPath = path;
    },
    loadAjax: function(filepath, callback) {
      itemsToAjax.push({
        filepath: filepath,
        callback: callback
      });
    },
    loadTexture: function(filepath, callback) {
      var image = new Image();
      image.crossOrigin = "Anonymous";
      var texture = new THREE.Texture();
      texture.image = image;
      texture.sourceFile = filepath;
      Loader.load(filepath, image, function() {
        texture.needsUpdate = true;
        if (typeof callback === 'function') {
          callback();
        }
      });
      return texture;
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
        item.element.addEventListener(eventName, listener);
        function listener() {
          item.element.removeEventListener(eventName, listener);
          item.callback && item.callback(); 
          registerAsLoaded(item); 
        };
        if(window.FILES) {
          item.element.src = 'data:audio/mp3;base64,' + FILES[item.filepath];
        } else {
          item.element.src = rootPath + item.filepath;
        }
      });
      itemsToAjax.forEach(function(item) {
        var response = null;
        var request = new XMLHttpRequest();
        request.open('GET', rootPath + item.filepath, 1);
        request.onload = function() {
          item.callback(request.responseText);
          registerAsLoaded(item);
        }
        request.send();
      });
    }
  };
})();
