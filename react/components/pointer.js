var React = require('react');
var createElement = React.createElement;
var types = React.PropTypes;

module.exports = React.createClass({
  displayName: 'Pointer',

  contextTypes: {
    action: types.func,
    authenticate: types.func,
    tree: types.object
  },

  childContextTypes: {
    componentPath: types.array
  },

  getChildContext: function() {
    return {
      componentPath: this.props.path
    };
  },

  render: function() {
    return this.context.tree[0][this.props.path];
  }
});
