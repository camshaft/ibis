var objectPath = require('object-path');
var PointerComponent = require('./components/pointer');
var validator = new (require('ajv'))({
  allErrors: true,
  jsonPointers: true,
  coerceTypes: true,
  removeAdditional: 'all',
  v5: true,
  useDefaults: true
});

module.exports = function(opts) {
  var controls = window.c = opts.controls;

  function createElement(type) {
    var control = controls[type];
    if (!control) {
      console.warn('Missing control ' + JSON.stringify(type));
      return null;
    }
    arguments[0] = control;
    return Element.apply(null, arguments);
  }

  return function(codec, encode, decode) {
    var codecs = {
      33: Affordance,
      34: ComponentPointer,
      31: createElement,
      32: Path,
      35: OpRemove,
      36: OpReplace,
      37: Schema
    };

    Object.keys(codecs).forEach(function(key) {
      var constructor = codecs[key];
      codec.addExtUnpacker(+key, function(data) {
        return constructor.apply(null, decode(data));
      });
    });
  };
};

var slice = [].slice;

function Affordance(ref, schema_id) {
  return function(schemas) {
    var fn = schemas[schema_id];

    function affordance(data) {
      var res = fn(data);
      res.ref = ref;
      return res;
    }

    affordance.ref = ref;

    return affordance;
  };
}

function ComponentPointer() {
  var path = Path.apply(null, arguments);
  return Element(
    PointerComponent,
    {path: path}
  );
}

function Element(type, props) {
  var el = {
    $$typeof: Symbol.for('react.element'),
    type: type,
    props: Object.assign({
      children: slice.call(arguments, 2)
    }, props)
  };

  Object.defineProperty(el, 'children', {
    get: function() {
      return el.props.children;
    },
    set: function(value) {
      el.props.children = value;
    }
  });

  return el;
}

function Path() {
  var path = slice.call(arguments);
  if (path.length === 1 && path[0].length == 0) return '$root';
  return JSON.stringify(path);
}

function OpReplace(value, type) {
  arguments[1] = convertPathType(type);
  var path = slice.call(arguments, 1);

  patch.value = value;

  function patch(obj) {
    obj = obj || {};
    objectPath.set(obj, path, value);
    return obj;
  }

  return patch;
}

function OpRemove(type) {
  arguments[0] = convertPathType(type);
  var path = slice.call(arguments);
  return function(obj) {
    obj = obj || {};
    objectPath.del(obj, path);
    return obj;
  };
}

var pathTypes = {
  0: 'components',
  1: 'schemas'
};
function convertPathType(type) {
  return pathTypes[type] || type;
}

function Schema(obj) {
  var v = validator.compile(obj || {});
  return function validate(data) {
    if (data === undefined) data = null;
    data = JSON.parse(JSON.stringify(data));
    var isValid = v(data);
    var errors = v.errors;
    if (errors) errors.forEach(function(error) {
      error.dataPath = '#' + (error.dataPath || '/');
    });

    return {
      isValid: isValid,
      errors: errors,
      data: data
    };
  };
}
