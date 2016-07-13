var createComponent = JSON.stringify(require.resolve('./create-component'));

module.exports = function(contents) {
  return [
    contents,
    'exports.default = require(' + createComponent + ')(exports, require("react"));'
  ].join('\n');
};
