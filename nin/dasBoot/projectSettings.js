var PROJECT = {
  get: function get(key, fallback) {
    if (key in PROJECT.data) {
      return PROJECT.data[key];
    } else {
      return fallback;
    }
  },
  data: {}
};
