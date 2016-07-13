var assign = require('object-assign');

module.exports = createContext;

function createContext(path, onChange, store, id) {
  var styles = [];
  var compiledStyles = [];
  var fn, version;

  var context = {
    setPath: setPath,
    render: render,
    destroy: destroy,
    _update: update
  };

  // subscribe to the initial path
  var sub = path ? store.subscribe(path, onUpdate) : null;

  function setPath(newPath) {
    if (path === newPath) return null;
    path = newPath;
    styles = [];
    compiledStyles = [];
    if (sub) return sub.set(path);
    return sub = store.subscribe(path, onUpdate);
  }

  function onUpdate(err, _fn, _version, _styles) {
    if (err) return console.error(err);
    _version = _version || Math.random();
    if (version === _version) return null;
    version = _version;
    fn = _fn.bind(null, store.createElement, store.createAffordance, store.createEvent, createStyle);
    styles = _styles;
    return update(true);
  }

  function update(purge) {
    if (purge) compiledStyles = null;
    compiledStyles = compiledStyles || store.compileStyles(id, path, styles);
    onChange(store.version + '|' + version);
  }

  function render(children) {
    return fn ?
      fn(children) :
      null;
  }

  function destroy() {
    store.removeContext(id);
    sub && sub.destroy();
  }

  function createStyle(ids) {
    return function(state) {
      state = assign({$default: true}, state);
      return ids.reduce(function(acc, id) {
        var compiled = compiledStyles[id];
        if (compiled) {
          Object.keys(state).forEach(function(key) {
            if (state[key] && compiled[key]) acc.push(compiled[key]);
          });
        }
        return acc;
      }, []).join(' ') || undefined;
    };
  }

  return context;
}
