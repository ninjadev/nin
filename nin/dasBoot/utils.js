// Array Remove - By John Resig (MIT Licensed)
Array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
};

Array.removeObject = function(array, object) {
  for(var i = 0; i < array.length; i++) {
    if(array[i] === object) {
      Array.remove(array, i);
      return;
    }
  }
};
