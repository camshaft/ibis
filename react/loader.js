var createComponent = JSON.stringify(require.resolve('./create-component'));

module.exports = function(contents) {
  return [
    contents,
    'export var displayName = exports.displayName || __module_name;',
    'export default require(' + createComponent + ')(exports, require("react"));'
  ].join('\n');
};
