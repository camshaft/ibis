var stringify = require('json-stable-stringify');
var assign = require('object-assign');
var hash = require('string-hash');

var validator = new (require('ajv'))({
  allErrors: true,
  jsonPointers: true,
  coerceTypes: true,
  removeAdditional: 'all',
  v5: true,
  useDefaults: true
});

module.exports = {compile: compile, compileBody: compileBody};

var CHILDREN = 'c';
var DOM = 'd';
var AFFORDANCE = 'a';
var EVENT = 'e';
var PATH = 'p';
var STYLE = 's';
var ARGS = [DOM, AFFORDANCE, EVENT, STYLE, CHILDREN].join(',');

function compile(ast, name) {
  return (new Function([], compileBody(ast, name)))();
}

function compileBody(ast, name) {
  var state = {affordances: {}, skins: [], name: name};
  var main = compileElement(ast, state);

  var styles = '[' + state.skins.map(function(config) {
    return JSON.stringify(config);
  }).join(',') + ']';

  var formattedName = formatName(name);

  return (
    'var _s = ' + formattedName + '.styles = ' + styles + '\n' +
    Object.keys(state.affordances).map(function(k) {return state.affordances[k];}) + '\n' +
    'var ' + PATH + ' = ' + JSON.stringify(name) + ';\n' +
    'return ' + formattedName + '\n' +
    'function ' + formattedName + '(' + ARGS + '){' +
      'return ' + main + ';' +
    '};' +
    '\n\n//# sourceURL=thot://' + name
  );
}

function formatName(name) {
  return typeof name == 'string' ?
    'render_' + name.replace(/[^\w]/g, '__') :
    '';
}

function compileElement(ast, state) {
  var type = typeof ast;
  if (type == 'string' || type == 'number' || type == 'boolean') return JSON.stringify(ast);

  var nodeType;
  if (!ast || !(nodeType = ast.type)) return 'null';
  if (nodeType == '$yield') return CHILDREN;

  var props = stringify(assign({}, ast.props, {key: ast.key}));
  var children = compileChildren(ast.children, state);

  var affordances = compileObject(ast.affordances || {}, function(affordance) {
    var schema = affordance.schema;
    if (!schema) return 'null';
    var result = compileSchema(schema);
    state.affordances[result.name] = result.code;
    return AFFORDANCE + '(' + PATH + ',' + JSON.stringify(affordance.ref) + ',' + result.schema + ',' + result.name + ')';
  });

  var events = compileObject(ast.events || {}, function(event) {
    return EVENT + '(' + stringify(event) +')';
  });

  var styles = compileObject(compileStyles(ast.styles, state), function(value) {
    return value;
  });

  return DOM + '(' + JSON.stringify(nodeType) + ',' + joinProps(props, children, affordances, events, styles) + ')';
}

function compileChildren(children, state) {
  if (!children) return 'null';
  if (Array.isArray(children)) {
    if (children.length == 0) return 'null';
    return '[' + children.map(function(child){return compileElement(child, state);}).join(',') + ']';
  }
  return compileObject(children, compileElement);
}

function compileObject(children, fn) {
  return '{' + Object.keys(children).map(function(key) {
    return JSON.stringify(key) + ':' + fn(children[key], key);
  }).join(',') + '}';
}

function compileSchema(schema) {
  var result = validator.compile(schema);
  var sourceCode = result.sourceCode;

  var name = 'a_' + hash(sourceCode);
  var orig = name + '_o';
  schema = name + '_s';

  var code = [
    'var ' + orig + ' = (function(){var' + sourceCode + ';return validate;})();',
    'var ' + schema + ' = ' + stringify(result.schema),
    'function ' + name + '(d) {',
    '  if (d === undefined) d = null;',
    '  d = JSON.parse(JSON.stringify(d));',
    '  var v = ' + orig + '(d);',
    '  var e = ' + orig + '.errors;',
    '  if (e) e.forEach(function(e){e.dataPath="#"+(e.dataPath||"/")})',
    '  return {isValid: v, errors: e, data: d};',
    '}'
  ].join('\n');

  return {
    name: name,
    schema: schema,
    code: code
  };
}

function compileStyles(children, state, acc, prefix) {
  acc = acc || {};
  if (!children) return acc;
  prefix = prefix || '';
  Object.keys(children).forEach(function(key) {
    var rule = children[key];
    var rulePrefix = prefix + key;
    var props = compileStyleProps(rule.props, state);
    if (props) acc[rulePrefix] = props;
    compileStyles(rule.children, state, acc, rulePrefix + '-');
  });
  return acc;
}

function compileStyleProps(props, state) {
  if (!props || !Array.isArray(props)) return undefined;
  return STYLE  + '([' + props.map(function(prop) {
    var skins = state.skins;
    var idx = skins.length;
    skins.push({type: prop.name, props: prop.params});
    return '' + idx;
  }).join(',') + '])';
}

var map = [].map;
function joinProps() {
  return map.call(arguments, function(arg) {
    return arg == '{}' ? 'null' : arg;
  }).join(',');
}
