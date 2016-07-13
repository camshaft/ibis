var createComponent = JSON.stringify(require.resolve('./create-component'));

module.exports = function(contents) {
  return [
    contents,
    'exports.displayName = exports.displayName || __module_name;',
    'exports.default = require(' + createComponent + ')(exports, require("react"));'
  ].join('\n');
};
