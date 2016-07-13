var React = require('react');
var createElement = React.createElement;
var PathComponent = require('./path');
var assign = require('object-assign');

module.exports = React.createClass({
  displayName: 'Router',

  contextTypes: {
    store: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {_v: 0};
  },

  componentWillReceiveProps: function(nextProps) {
    this.pathComponents = this.splitPath(nextProps.path);
  },

  componentWillMount: function() {
    this.contexts = [];
    this.pathComponents = this.splitPath(this.props.path);
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    var state = this.state;
    nextState = nextState || {};
    return this.props.path !== nextProps.path || state._v !== nextState._v;
  },

  render: function() {
    return this.pathComponents.reduceRight(function(child, props) {
      return createElement(PathComponent, props, child);
    }, null);
  },

  splitPath: function(path) {
    var self = this;
    var components = [];

    var i = 0;
    (path || '').split('/').reduce(function(acc, component) {
      if (!component) return acc;
      component = acc + '/' + component;
      var context = self.initContext(component, i);
      components.push({
        path: component,
        render: context.render
      });
      i++;
      return component;
    }, '');

    var contexts = self.contexts;
    for (var c; i < contexts.length; i++) {
      c = contexts[i];
      if (c) c.destroy();
      contexts[i] = null;
    }

    return components;
  },
  initContext: function(path, i) {
    var contexts = this.contexts;
    var context = contexts[i] = contexts[i] || this.context.store.context(null, this.onChange.bind(null, i));
    context.setPath(path);
    return context;
  },
  onChange: function(i) {
    this.setState({
      _v: this.state._v + 1
    });
  }
});
