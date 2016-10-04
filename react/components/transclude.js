var React = require('react');
var types = React.PropTypes;

module.exports = React.createClass({
  displayName: 'Transclude',

  contextTypes: {
    transclude: types.func
  },

  render: function() {
    var props = this.props;
    return this.context.transclude(props.src, props.props);
  }
});
