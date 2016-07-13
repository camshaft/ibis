var React = require('react');
var createElement = React.createElement;
var StoreContainer = require('./container');
var Router = require('./router');

module.exports = function(store) {
  return function(path) {
    return createElement(StoreContainer, {
      store: store
    }, createElement(Router, {
      path: path || ''
    }));
  };
};
