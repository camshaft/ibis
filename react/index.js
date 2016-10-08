var React = require('react');
var createElement = React.createElement;
var Application = require('./components/application');

module.exports = function(config) {
  var entry = config.entry;
  return function createApp(src, props) {
    var app = createElement(Application, Object.assign({
      src: src,
      props: props
    }, config));
    if (entry) app = createElement(entry, null, app);
    return app;
  };
};
