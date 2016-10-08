var stack = require('poe-ui/server');
var webpack = require('webpack');

module.exports = function(opts) {
  // TODO set options to remove loaders and set them up here
  opts = opts || {};
  opts.builder = {
    styles: false,
    jade: false
  };
  var app = stack(opts);

  var builder = app.builder;
  var es6 = builder.addES6.loader;
  var ast2template = 'ast2template-loader?native-path=1&root=' + require.resolve(process.cwd() + '/src/root.js');

  var essLoader = require.resolve('ess-loader') + '!' + es6 + '!' + ast2template + '&keyName=false&pass-through=1!ess2ast-loader?urlRequire=1';
  var componentLoader = require.resolve('./react/loader');

  builder.resolve.extensions.push('.jade');
  builder.addLoader('jade', es6 + '!' + componentLoader + '!' + ast2template + '!jade2ast-loader');

  builder.addLoader(/\.(ess\?(dynamic|raw))$/, essLoader);
  builder.addLoader(/\.(ess)$/, require.resolve('style-loader') + '!' + essLoader);

  builder.plugins.push(new webpack.IgnorePlugin(/regenerator|nodent|js\-beautify/, /ajv/));

  // remove the weird resolving plugin in poe-ui-builder
  builder.plugins = builder.plugins.filter(function(plugin) {
    return plugin.constructor.name != 'ResolverPlugin';
  });

  return app;
};
