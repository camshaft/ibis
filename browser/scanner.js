var forEach = [].forEach;

module.exports = function(selector, create) {
  scan.create = create;
  return scan;

  function scan(doc) {
    forEach.call(doc.querySelectorAll(selector), create);
  };
};
