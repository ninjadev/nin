const $ = require('jquery');
window.$ = $;
window.jQuery = $;

const React = require('react');
const ReactDOM = require('react-dom');

const Main = require('./components/main');

ReactDOM.render(<Main />, document.getElementById('root'));

require('jquery-ui/themes/base/all.css');
