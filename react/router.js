var React = require('react');
var createElement = React.createElement;
var PathComponent = require('./path');

module.exports = React.createClass({
  displayName: 'Router',

  shouldComponentUpdate: function(nextProps) {
    return nextProps.path !== this.props.path;
  },

  render: function() {
    return splitPath(this.props.path || '').reduceRight(function(child, path) {
      return createElement(PathComponent, {path: path}, child);
    }, null);
  }
});

function splitPath(path) {
  var components = [];

  path.split('/').reduce(function(acc, component) {
    if (!component) return acc;
    component = acc + '/' + component;
    components.push(component);
    return component;
  }, '');

  return components;
}
