var Context = require('./context');
var assign = require('object-assign');
var encodeQuery = require('qs/lib/stringify');

module.exports = createStore;

function createStore(config) {
  var contextId = 0;
  var contexts = [];
  var contextStyles = {};

  var store = assign({
    controls: {},
    skins: {},
    setControls: setControls,
    setSkins: setSkins,
    createAffordance: createAffordance,
    createEvent: createEvent,
    prefix: '',
    context: createContext,
    removeContext: removeContext,
    compileStyles: compileStyles
  }, config);

  if (typeof store.controls === 'function') store.controls(setControls);
  if (typeof store.skins === 'function') store.skins(setSkins);

  Object.keys(store).forEach(function(key) {
    var val = store[key];
    if (typeof val === 'function') store[key] = val.bind(store);
  });

  Object.defineProperty(store, 'version', {
    get: function() {
      return controlsVersion + '|' + skinsVersion;
    }
  });

  var controlsVersion = 0;
  function setControls(_controls) {
    store.controls = _controls;
    controlsVersion++;
    update();
  }

  var skinsVersion = 0;
  function setSkins(_skins) {
    store.skins = _skins;
    skinsVersion++;
    update(true);
  }

  function update(purge) {
    contexts.forEach(function(context) {
      context._update(purge);
    });
  }

  function createContext(path, cb) {
    var id = contextId++;
    var context = new Context(path, cb, store, id);
    contexts.push(context);
    return context;
  }

  function removeContext(id) {
    contexts = contexts.filter(function(context) {
      return context.id !== id;
    });
    // clear any styles
    Object.keys(contextStyles[id] || {}).forEach(function(key) {
      store.onStyle(key, null);
    });
    delete contextStyles[id];
  }

  function compileStyles(context, path, styles) {
    var prev = contextStyles[context] || {};
    var current = {};

    var c = compileStyle.bind(null, store.skins, store.prefix, gensym);
    var ids = (styles || []).map(function(style, i) {
      var compiled = c(style || {}, context + '-' + i);
      if (!compiled) {
        console.warn('Missing style: ' + style.type);
        return {};
      }

      store.onStyle(compiled.id, compiled.css);
      current[compiled.id] = true;

      return compiled.map;
    });

    Object.keys(prev).forEach(function(id) {
      if (!current[id]) store.onStyle(id, null);
    });

    contextStyles[context] = current;

    return ids;
  };

  function gensym() {
    return '_' + store.uuid();
  }

  return store;
}

function createAffordance(path, ref, schema, validate) {
  affordance.isAvailable = !!(path && ref);
  affordance.schema = schema;

  return affordance;

  function affordance(data) {
    var result = validate(data);
    return {
      path: path,
      ref: ref,
      schema: schema,
      isValid: result.isValid,
      errors: result.errors,
      data: result.data,
      isAvailable: affordance.isAvailable,
      fieldErrors: function(field) {
        return (result.errors || []).filter(function(error) {
          // TODO handle required properties correctly
          return error.dataPath == field;
        });
      }
    };
  };
}

function createEvent() {
  // TODO
  return null;
}

function compileStyle(skins, prefix, gensym, style, id) {
  var type = style.type;
  var props = style.props;
  var qs = encodeQuery(assign({}, props, {_: id}));
  var key = '/' + type + '?' + qs;

  var compiler = skins[type];
  if (!compiler) return null;

  var skin = compiler(prefix, gensym, props);

  return {
    css: skin.toString(),
    map: skin,
    id: key
  };
}
