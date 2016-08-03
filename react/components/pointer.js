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

  render: function() {
    return this.context.tree.components[this.props.path];
  }
});
