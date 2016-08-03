var glob = require('glob');
var Path = require('path');
var loaderUtils = require('loader-utils');

exports = module.exports = function() {};
exports.pitch = function(remainingRequest) {
  (new Routes(this, {}, remainingRequest)).compile(this.async());
};

function Routes(loader, opts, remainingRequest) {
  this.loader = loader;
  var entry = this.entry = loader.resourcePath;
  this.query = loader.resourceQuery || '';
  this.dir = Path.dirname(entry);
  loader.addContextDependency(this.dir);
  this.ext = Path.extname(entry);
  remainingRequest = remainingRequest.split('!').slice(0, -1).join('!');
  this.remainingRequest = remainingRequest ? '!!' + remainingRequest + '!' : '!!';
}

Routes.prototype.compile = function(cb) {
  glob(this.dir + '/**/*' + this.ext, {mark: true}, function(err, files) {
    if (err) return cb(err);

    var formatted = files.reduce(this.formatFile.bind(this), []);

    var requests = formatted.map(function(file) { return file.request; });

    var out = [
      'var modules = {',
      formatted.map(function(file) {
        return '  ' + JSON.stringify(file.name) + ':' + 'require.resolve(' + JSON.stringify(file.request) + ')';
      }).join(',\n'),
      '};',
      'Object.keys(modules).forEach(function(name) {Object.defineProperty(exports, name, {get: function() { return __webpack_require__(modules[name]).default; }})});',
    ].join('\n');

    return cb(null, out);
  }.bind(this));
};

Routes.prototype.formatFile = function(acc, file) {
  // ignore __*__ directories
  if (/__\w+__/.test(file)) return acc;

  // watch directories
  if (file.charAt(file.length - 1) === '/') {
    this.loader.addContextDependency(file);
    return acc;
  }

  var relative = Path.relative(this.dir, file);
  if (Path.basename(file, this.ext) === 'index') {
    relative = Path.dirname(relative);
  } else {
    relative = relative.slice(0, - this.ext.length);
  }

  if (relative === '.') relative = '__default';

  acc.push({
    request: this.remainingRequest + file + this.query,
    name: relative
  });

  return acc;
};
