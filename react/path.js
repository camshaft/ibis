var React = require('react');

module.exports = React.createClass({
  displayName: 'PathComponent',

  render: function() {
    var props = this.props;
    return props.render(props.children);
  }
});
