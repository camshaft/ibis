var React = require('react');

module.exports = React.createClass({
  displayName: 'PathComponent',

  childContextTypes: {
    send: React.PropTypes.func
  },

  getChildContext: function() {
    return {send: this.props.send};
  },

  render: function() {
    var props = this.props;
    return props.render(props.children);
  }
});
