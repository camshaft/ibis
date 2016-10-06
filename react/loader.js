var createComponent = JSON.stringify(require.resolve('./create-component'));

module.exports = function(contents) {
  return [
    'var React = require("react");',
    contents,
    'export var displayName = exports.displayName || __module_name;',
    'export default require(' + createComponent + ')(exports, React);'
  ].join('\n');
};
