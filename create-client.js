var Emitter = require('events');
var URL = require('url');

module.exports = createClient;

var events = [
  'mounted',
  'unmounted',
  'notFound',
  'authenticationRequired',
  'authenticationInvalid',
  'unauthorized',
  'authenticationAcknowledged',
  'actionAcknowledged',
  'actionInvalid',
  'error'
];

var handler = events.reduce(function(acc, name) {
  acc[name] = function(message) {
    this.emitter.emit(message.instance, name, message);
  };
  return acc;
}, {
  init: function(emitter) {
    this.emitter = emitter;
  }
});

function createClient(createConnection) {
  var hosts = {};
  return function createInstance(src, props, app) {
    var url = URL.parse(src);
    var path = url.pathname;
    url.pathname = url.path = '';

    url = URL.format(url);
    var host = hosts[url];

    if (!host) host = hosts[url] = createHost(url, createConnection);

    return host(path, props, app);
  };
}

function createHost(host, createConnection) {
  var emitter = new Emitter();
  var conn = createConnection(host, handler, emitter);

  var i = 0;
  return function(path, props, app) {
    return createInstance(conn, emitter, i++, path, props, app);
  };
}

function createInstance(conn, emitter, instance, path, props, app) {
  var actions = {};
  var authentications = {};

  function call(name, message) {
    if (app && app[name]) app[name](message);
  }

  function invokeCallback(callbacks, id, error, message) {
    if (typeof callbacks[id] == 'function') callbacks[id](error, message);
    delete callbacks[id];
  }

  var currentState = null;

  var events = {
    mounted: function(_, message) {
      currentState = message.state;
      client.isMounted = true;
      call('mount', message);
    },
    unmounted: function(_, message) {
      client.isMounted = false;
      call('unmount', message);
    },
    notFound: function(_, message) {
      call('notFound', message);
    },
    authenticationRequired: function(_, message) {
      call('authenticationRequired', message);
    },
    unauthorized: function(_, message) {
      call('unauthorized', message);
    },
    error: function(_, message) {
      call('error', message);
    },

    // callback specific
    authenticationInvalid: function(_, message) {
      invokeCallback(authentications, message.method, new Error(message.info), message);
    },
    authenticationAcknowledged: function(_, message) {
      invokeCallback(authentications, message.method, null, message);
    },

    actionInvalid: function(_, message) {
      invokeCallback(actions, message.ref, new Error(message.info), message);
    },
    actionAcknowledged: function(_, message) {
      invokeCallback(actions, message.ref, null, message);
    }
  };

  function onEvent(event) {
    (events[event] || noop).apply(null, arguments);
  }

  emitter.on(instance, onEvent);

  if (path) conn.mount(instance, path, currentState, props);

  var client = {
    instance: instance,
    isMounted: false,
    mount: function(src, newProps) {
      if (!app) return client;
      var url = URL.parse(src);
      // TODO handle host changing here
      path = url.pathname;
      props = newProps;
      conn.mount(instance, path, currentState, props);
      return client;
    },
    unmount: function() {
      if (!app) return client;
      app = null;
      emitter.removeListener(instance, onEvent);
      conn.unmount(instance);
      return client;
    },
    action: function(ref, data, cb) {
      if (!app) return client;
      if (actions[ref]) return cb(new Error('Another action for ' + JSON.stringify(ref) + ' in currently being executed'));
      if (!conn.isConnected()) conn.mount(instance, path, currentState, props);
      conn.action(instance, ref, data);
      actions[ref] = cb || true;
      return client;
    },
    authenticate: function(method, token, cb) {
      if (!app) return null;
      if (authentications[method]) return cb(new Error('Another authentication for ' + JSON.stringify(method) + ' in currently being executed'));
      if (!conn.isConnected()) conn.mount(instance, path, currentState, props);
      conn.authenticate(instance, method, token);
      authentications[method] = cb || true;
      return client;
    }
  };

  return client;
}

function noop() {}
