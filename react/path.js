var React = require('react');

module.exports = React.createClass({
  displayName: 'PathComponent',

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

  shouldComponentUpdate: function(nextProps, nextState) {
    var version = (this.state || {}).version;
    return (nextState || {}).version !== version || nextProps.path !== this.props.path;
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
