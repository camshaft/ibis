var forEach = [].forEach;

var CAN_WATCH = typeof MutationObserver !== 'undefined';

module.exports = function(doc, selector, create) {
  if (selector.charAt(0) !== '.') selector = '.' + selector;

  forEach.call(doc.querySelectorAll(selector), function(element) {
    create(element);

    if (CAN_WATCH) {
      var observer = new MutationObserver(function(mutations) {
        create(element);
      });

      observer.observe(element, {attributes: true});

      // TODO watch parent for removal
    }
  });
};
