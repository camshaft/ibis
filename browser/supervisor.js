var EventEmitter = require('events');
var Counter = require('reference-count');

var slice = [].slice;

module.exports = function(worker) {
  var emitter = new EventEmitter();
  var counter = new Counter();

  var cache = {};
  var errors = {};

  worker.addEventListener('message', _onmessage, false);

  counter.on('resource', function(resource) {
    _send('resolve', resource);
  });

  counter.on('garbage', function(resource) {
    // TODO mark the resource for collection
    // TODO call unmount on the resource
  });

  function _send() {
    worker.postMessage(JSON.stringify(slice.call(arguments)));
  }

  function _onmessage(evt) {
    var message = JSON.parse(evt.data);
    handler[message[0]].apply(null, message.slice(1));
  }

  function notify(path) {
    notifyCallback(path, function(err, fn, hash, styles) {
      emitter.emit(path, err, fn, hash, styles);
    });
  }

  function notifyCallback(path, cb) {
    var fn = cache[path] || {};
    var err = errors[path];
    if (fn.fn || err) cb(errors[path], fn.fn, fn.hash, fn.styles);
  }

  var handler = {
    resolved: function(path, body, hash) {
      var users = 0;
      var prev = cache[path];
      var fn = (new Function(['equal', 'formats'], body))(
        require('ajv/lib/compile/equal'),
        formats
      );

      cache[path] = {
        fn: fn,
        hash: hash,
        styles: fn.styles
      };
      delete errors[path];
      notify(path);
    },
    authenticationInvalid: function(method) {
      // TODO
    }
  };

  for (var k in serverErrors) {
    handler[k] = function(name, path) {
      delete cache[path];
      errors[path] = errors[name].apply(null, slice.call(arguments, 1));
      notify(path);
    }.bind(null, k);
  }

  var _id = 0;
  function subscribe(path, cb) {
    var id = id++;

    if (path) set(path);

    function unsubscribe() {
      if (path) emitter.removeListener(path, cb);
    }

    function set(newPath) {
      unsubscribe();

      path = newPath;
      emitter.on(path, cb);
      notifyCallback(path, cb);

      counter.sweep(id).count(path).done();
    }

    function destroy() {
      unsubscribe();
      counter.destroy(id);
    }

    return {
      set: set,
      destroy: destroy
    };
  };

  function authenticate(method, token) {
    _send('authenticate', method, token);
  }

  function message(path, affordance, body) {
    _send('message', path, affordance, body);
  }

  function changeConfig(config) {
    _send('changeConfig', config);
  }

  return {
    subscribe: subscribe,
    authenticate: authenticate,
    message: message,
    changeConfig: changeConfig
  };
};

var serverErrors = {
  unresolved: [],
  authenticationRequired: ['methods'],
  unauthorized: ['info'],
  messageInvalid: ['affordance', 'info'],
  error: ['info']
};

for (var name in serverErrors) {
  serverErrors[name] = function(name, fields, path) {
    var err = new Error();
    err.type = name;
    err.path = path;
    fields.forEach(function(field, i) {
      err[field] = arguments[i + 3];
    });
    return err;
  }.bind(null, name, serverErrors[name]);
}

var formats = {
  date: /^\d\d\d\d-[0-1]\d-[0-3]\d$/,
  time: /^[0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:z|[+-]\d\d:\d\d)?$/i,
  'date-time': /^\d\d\d\d-[0-1]\d-[0-3]\d[t\s][0-2]\d:[0-5]\d:[0-5]\d(?:\.\d+)?(?:z|[+-]\d\d:\d\d)$/i,
  uri: /^(?:[a-z][a-z0-9+-.]*)?(?:\:|\/)\/?[^\s]*$/i,
  email: /^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i,
  hostname: /^[a-z](?:(?:[-0-9a-z]{0,61})?[0-9a-z])?(\.[a-z](?:(?:[-0-9a-z]{0,61})?[0-9a-z])?)*$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/,
  ipv6: /^\s*(?:(?:(?:[0-9a-f]{1,4}:){7}(?:[0-9a-f]{1,4}|:))|(?:(?:[0-9a-f]{1,4}:){6}(?::[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){5}(?:(?:(?::[0-9a-f]{1,4}){1,2})|:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(?:(?:[0-9a-f]{1,4}:){4}(?:(?:(?::[0-9a-f]{1,4}){1,3})|(?:(?::[0-9a-f]{1,4})?:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){3}(?:(?:(?::[0-9a-f]{1,4}){1,4})|(?:(?::[0-9a-f]{1,4}){0,2}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){2}(?:(?:(?::[0-9a-f]{1,4}){1,5})|(?:(?::[0-9a-f]{1,4}){0,3}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?:(?:[0-9a-f]{1,4}:){1}(?:(?:(?::[0-9a-f]{1,4}){1,6})|(?:(?::[0-9a-f]{1,4}){0,4}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(?::(?:(?:(?::[0-9a-f]{1,4}){1,7})|(?:(?::[0-9a-f]{1,4}){0,5}:(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(?:%.+)?\s*$/i,
  regex: function(str) {
    try {
      new RegExp(str);
      return true;
    } catch(e) {
      return false;
    }
  },
  uuid: /^(?:urn\:uuid\:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  'json-pointer': /^(?:\/(?:[^~\/]|~0|~1)+)*(?:\/)?$|^\#(?:\/(?:[a-z0-9_\-\.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)+)*(?:\/)?$/i,
  'relative-json-pointer': /^(?:0|[1-9][0-9]*)(?:\#|(?:\/(?:[^~\/]|~0|~1)+)*(?:\/)?)$/
};
