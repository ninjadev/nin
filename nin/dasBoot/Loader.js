var Loader = (function(){
  var eventNames = {
    VIDEO: 'canplaythrough',
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
        callback && callback();
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
          var prefix = {
            'jpg': 'data:image/jpg;base64,',
            'jpeg': 'data:image/jpg;base64,',
            'png': 'data:image/png;base64,',
            'mp3': 'data:audio/mp3;base64,',
            'mp4': 'data:video/mp4;base64,',
            'svg': 'data:image/svg+xml;base64,',
          }[item.filepath.slice(-3)];
          console.log(item.filepath, prefix + (FILES[item.filepath] && FILES[item.filepath].slice(0, 10)));
          item.element.src = prefix + FILES[item.filepath];
        } else {
          item.element.src = rootPath + item.filepath + '?_=' + Math.random();
        }
      });
      itemsToAjax.forEach(function(item) {
        if(window.FILES) {
          console.log(item.filepath, FILES[item.filepath] && atob(FILES[item.filepath]).slice(0, 10));
          item.callback(atob(FILES[item.filepath]));
          registerAsLoaded(item); 
        } else {
          var response = null;
          var request = new XMLHttpRequest();
          request.open('GET', rootPath + item.filepath, 1);
          request.onload = function() {
            item.callback(request.responseText);
            registerAsLoaded(item);
          }
          request.send();
        }
      });
    }
  };
})();
