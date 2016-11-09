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
  "extends": "angular",
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
    "angular/no-service-method": ["off"],
    "angular/controller-name": ["off"],
    "angular/window-service": ["off"],
    "angular/document-service": ["off"],
    "angular/di-unused": ["error"],
    "angular/definedundefined": ["off"],
    "angular/log": ["off"],
    "angular/json-functions": ["off"],
    "angular/angularelement": ["off"],
  }
};
