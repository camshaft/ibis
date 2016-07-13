var assign = require('object-assign');
var React = require('react');
var createElement = React.createElement;
var PathComponent = require('./path');

var NOT_FOUND = '$not-found';
var TRANSCLUDE = '$transclude';

module.exports = function(type, props, children, affordances, events, styles) {
  var store = this;
  var controls = store.controls;
  var control = controls[type];

  if (type === TRANSCLUDE) control = PathComponent;

  if (!control) return controls[NOT_FOUND] ? createElement(controls[NOT_FOUND], {type: type}) : null;

  affordances = affordances || {};
  events = events || {};
  styles = styles || {};

  return createElement.apply(null, [
    control,
    assign({}, props, {
      $affordance: function(name) {
        return affordances[name] || store.createAffordance(null, null, null, defaultValidate);
      },
      $event: function(name) {
        // TODO
      },
      $style: function(name, generalState) {
        var fn = styles[name] || styleNoop;
        return generalState ? fn : function(state){ return fn(assign({}, generalState, state)); };
      }
    })
  ].concat(children));
};

function styleNoop() {
  return undefined;
}

function defaultValidate() {
  return false;
}
defaultValidate.errors = [];
