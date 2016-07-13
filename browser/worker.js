var hash = require('string-hash');
var compiler = require('../compiler');

var slice = [].slice;

module.exports = function(worker, client) {
  worker.addEventListener('message', _onmessage, false);

  client.on('resolved', function(path, ast) {
    var fn = compile(ast, path);
    _send('resolved', path, fn.body, fn.hash);
  });

  client.on('unresolved', function(path) {
    // TODO
  });

  client.on('authenticationRequired', function(path, methods) {
    // TODO
  });

  client.on('authenticationInvalid', function(method) {
    // TODO
  });

  client.on('unauthorized', function(path, info) {
    // TODO
  });

  client.on('messageInvalid', function(path, affordance, info) {
    // TODO
  });

  // TODO we probably need specific internal server errors for resolve, message, and authenticate
  client.on('error', function(path, info) {
    // TODO
  });

  // TODO send status changes up (offline, online, etc)

  function _send() {
    worker.postMessage(JSON.stringify(slice.call(arguments)));
  }

  function _onmessage(evt) {
    var message = JSON.parse(evt.data);
    client[message[0]].apply(client, message.slice(1));
  }
};

function compile(ast, path) {
  var body = compiler.compileBody(ast, path);
  return {
    body: body,
    hash: '' + hash(body)
  };
}
