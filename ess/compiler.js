var DOM = require("ess-compiler/dom");
var Root = require("ess-compiler/lib/dom/root");
var Rule = require("ess-compiler/lib/dom/rule");
var Selector = require("ess-compiler/lib/dom/selector");

var root = '__ROOT__';
var rootRe = new RegExp('^' + root + '-*');
var DEFAULT = '$default';

module.exports = function(render) {
  return function(prefix, gensym, props) {
    var selectors = {};

    if (prefix) prefix += ' ';

    // monkeypatch selector prototype
    var toString = Selector.prototype.toString;
    Selector.prototype.toString = function() {
      var sel = toString.call(this).replace(rootRe, '');

      // they're tring to style elements!
      if (sel.charAt(0) === ' ') return prefix + '.' + gensym();

      var parts = sel.split(/\:/);
      var postfix = parts[1];
      sel = parts[0] || DEFAULT;

      return prefix + '.' + (selectors[sel] = selectors[sel] || gensym()) + (postfix ? ':' + postfix : '');
    };

    try {
      var children = DOM([root], null, render(DOM, null, props));
      var css = (new Root(children)).toString();
    } catch(_) {}

    Selector.prototype.toString = toString;

    selectors.toString = function() {
      return css || '';
    };
    return selectors;
  };
};
