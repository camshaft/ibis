var ReactDOM = require('react-dom');

var CAN_WATCH = typeof MutationObserver !== 'undefined';

module.exports = function(createApp, attr) {
  attr = attr || 'data-src';
  return function(element) {
    function render() {
      var path = element.getAttribute(attr);

      return ReactDOM.render(createApp(path), element);
    }

    if (CAN_WATCH) {
      var observer = new MutationObserver(function(mutations) {
        render();
      });

      observer.observe(element, {attributes: true});

      // TODO watch parent for removal
    }

    return render();
  };
};
