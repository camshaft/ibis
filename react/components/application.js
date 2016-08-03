var React = require('react');
var types = React.PropTypes;

module.exports = React.createClass({
  displayName: 'Application',

  componentWillMount: function() {
    var props = this.props;
    this.client = props.createClient(props.src, props.props, this);
  },

  componentWillReceiveProps: function(newProps) {
    var props = this.props;
    if (props.src !== newProps.src ||
        JSON.stringify(props.props) !== JSON.stringify(newProps.props)) {
      this.client.mount(newProps.src, newProps.props);
    }
  },

  componentWillUnmount: function() {
    this.client.unmount();
  },

  childContextTypes: {
    action: types.func,
    authenticate: types.func,
    tree: types.object
  },

  getChildContext: function() {
    var client = this.client;
    var props = this.props;
    return {
      action: client.action,
      authenticate: client.authenticate,
      tree: this.state.tree
    };
  },

  getInitialState: function() {
    return {
      tree: {
        components: {
          $root: null
        },
        schemas: {}
      }
    };
  },

  render: function() {
    return this.state.tree.components.$root;
  },

  // client callbacks
  mount: function(message) {
    var tree = message.body.reduce(function(acc, fun) {
      return fun(acc);
    }, this.state.tree);

    this.setState({tree: tree});
  },

  unmount: function() {

  },

  notFound: function() {

  },

  authenticationRequired: function() {

  },

  unauthorized: function() {

  },

  error: function() {

  }
});
