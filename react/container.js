var React = require('react');

module.exports = React.createClass({
  displayName: 'StoreContainer',

  childContextTypes: {
    store: React.PropTypes.object
  },

  getChildContext: function() {
    return {store: this.props.store};
  },

  render: function() {
    return this.props.children || null;
  }
});
