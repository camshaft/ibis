var React = require('react');
var createElement = React.createElement;
var Application = require('./components/application');

module.exports = function(config) {
  return function createApp(src, props) {
    return createElement(Application, Object.assign({
      src: src,
      props: props
    }, config));
  };
};
