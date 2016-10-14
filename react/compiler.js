var createPatcher = require('./patch').createPatcher;
var elementType = Symbol.for('react.element');

var patcher = createPatcher(function(apply, value, patch) {
  if (value && value.$$typeof === elementType) {
    patch = {
      props: Object.assign(patch.props || {}, {
        children: patch.children
      })
    };
  }
  return apply(value, patch);
});

var PointerComponent = require('./components/pointer');
var validator = new (require('ajv/lib/ajv'))({
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
      35: Patch,
      36: Schema,
      37: Subscription
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
  if (module.hot) {
    // We need to hook into any hot-module replacement proxies
    type = require('react').createElement(type).type;
  }
  return {
    type: type,
    props: Object.assign({
      children: slice.call(arguments, 2)
    }, props),
    $$typeof: elementType
  };
};

function Path() {
  var path = slice.call(arguments);
  if (path.length === 1 && path[0].length == 0) return '$root';
  return path;
}

function Patch(patch) {
  return function(value) {
    return patcher(value, patch);
  };
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
