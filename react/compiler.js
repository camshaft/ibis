var objectPath = require('object-path-immutable');
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
  var controls = opts.controls;

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
      37: OpCopy,
      38: Schema,
      39: Subscription
    };

    Object.keys(codecs).forEach(function(key) {
      var constructor = codecs[key];
      codec.addExtUnpacker(+key, function(data) {
        data = decode(data);
        if (!Array.isArray(data)) data = [data];
        return constructor.apply(null, data);
      });
    });
  };
};

var slice = [].slice;

function Affordance(ref, schema_id) {
  return {
    ref: ref,
    schema_id: schema_id
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
  return {
    $$typeof: Symbol.for('react.element'),
    type: type,
    props: Object.assign({
      children: slice.call(arguments, 2)
    }, props)
  };
}

function Path() {
  var path = slice.call(arguments);
  if (path.length === 1 && path[0].length == 0) return '$root';
  return JSON.stringify(path);
}

function OpReplace(value, type) {
  arguments[1] = convertPathType(type);
  var path = fixChildrenPath(arguments, 1);

  patch.value = value;

  function patch(obj) {
    return objectPath.set(obj || {}, path, value);
  }

  return patch;
}

function OpRemove(type) {
  arguments[0] = convertPathType(type);
  var path = fixChildrenPath(arguments);
  return function(obj) {
    return objectPath.del(obj || {}, path);
  };
}

function OpCopy(from, to) {
  from[0] = convertPathType(from[0]);
  to[0] = convertPathType(to[0]);
  from = fixChildrenPath(from);
  to = fixChildrenPath(to);

  return function(obj, init) {
    var value = getAtPath(init, from);
    return objectPath.set(obj || {}, to, value);
  };
}

function getAtPath(obj, path) {
  for (var i = 0, parent = obj; i < path.length; i++) {
    if (typeof parent !== 'object') return undefined;
    parent = parent[path[i]];
  }
  return parent;
}

function fixChildrenPath(path, start) {
  var acc = [];
  for (var i = (start || 0), key; i < path.length; i++) {
    key = path[i];
    if (key == 'children') acc.push('props', 'children');
    else acc.push(key);
  }
  return acc;
}

var pathTypes = {
  0: 'components',
  1: 'schemas'
};
function convertPathType(type) {
  return pathTypes[type] || type;
}

function Schema(schema) {
  schema = schema || {};
  var v = validator.compile(schema);
  function validate(data) {
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
      data: data,
      schema: schema
    };
  };

  validate.schema = schema;

  return validate;
}

function Subscription(id) {
  return id;
}
