module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "es6": true
  },
  "parser": "babel-eslint",
  "settings": {
    "ecmascript": 6,
  },
  "plugins": ["babel"],
  "parserOptions": {
    "sourceType": "module",
    "ecmaVersion": 2015,
  },
  "globals": {
    "GU": false
  },
  "rules": {
    "indent": [
      "error",
      2
    ],
    "semi": [
      "error",
      "always"
    ],
    "no-trailing-spaces": [
      "error"
    ],
    "linebreak-style": [
      "error",
      "unix"
    ],
    "no-console": [
      "off",
      {
        "allow": ["warn", "error"]
      }
    ],
    "no-var": [
      "off"
    ],
    "eqeqeq": [
      "off",
      "smart"
    ],
  }
};
