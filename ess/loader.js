var compiler = JSON.stringify(require.resolve('./compiler'));
module.exports = function(contents) {
  return [
    contents,
    'exports.default = (require(' + compiler  + '))(exports.render);'
  ].join('\n');
};
