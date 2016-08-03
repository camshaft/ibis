exports = module.exports = function(src) {
  return src;
};
// exports.pitch = function(remaining) {
//   var req = JSON.stringify('!!' + remaining);
//   return [
//     'var fns = [];',
//     'module.exports = function(fn) {',
//     '  if (module.hot) fns.push(fn);',
//     '  fn(require(' + req + '));',
//     '}',
//     'if (module.hot) {',
//     '  module.hot.accept(' + req + ', function() {',
//     '    var mod = require(' + req + ');',
//     '    fns.forEach(function(fn){fn(mod);})',
//     '  });',
//     '}'
//   ].join('\n');
// };
