var React = require('react');

module.exports = React.createClass({
  displayName: 'Transclude',

  contextTypes: {
    store: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return {
      version: null
    };
  },

  componentWillMount: function() {
    var self = this;
    self.store = self.context.store.context(self.props.path, function(version) {
      if (self.isMounted()) self.setState({version: version});
    });
  },

  componentWillReceiveProps: function(newProps) {
    this.store.setPath(newProps.path);
  },

  componentWillUnmount: function() {
    this.store.destroy();
  },

  render: function() {
    var self = this;
    var store = self.store;
    return store ? store.render(self.props.children) : false;
  }
});
