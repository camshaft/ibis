var ReactDOM = require('react-dom/server');

module.exports = function(createApp) {
  return function(path) {
    return ReactDOM.renderToString(createApp(path));
  };
};
