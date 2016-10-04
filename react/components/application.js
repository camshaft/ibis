var React = require('react');
var createElement = React.createElement;
var types = React.PropTypes;
var URL = require('url');

var Application = module.exports = React.createClass({
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
    tree: types.object,
    transclude: types.func,
    appSrc: types.string
  },

  getChildContext: function() {
    var client = this.client;
    var props = this.props;
    return {
      action: client.action,
      authenticate: client.authenticate,
      tree: this.state.tree,
      transclude: this.transclude,
      appSrc: props.src
    };
  },

  transclude: function(src, appProps) {
    var props = this.props;

    if (src && src.charAt(0) == '/') {
      var url = URL.parse(src);
      url.pathname = url.path = src;
      src = URL.format(url);
    }

    return createElement(Application, Object.assign({}, props, {
      src: src,
      props: appProps
    }));
  },

  getInitialState: function() {
    return {
      tree: {
        components: {
          $root: null
        },
        schemas: {}
      },
      error: null
    };
  },

  render: function() {
    var state = this.state;
    var error = state.error;
    return error ?
      createElement('pre', {
        style: {
          color: 'red',
          'font-family': 'monospace'
        }
      }, error) :
      state.tree.components.$root;
  },

  // client callbacks
  mount: function(message) {
    var tree = message.body.reduce(function(acc, fun) {
      return fun(acc);
    }, this.state.tree);

    this.setState({tree: tree, error: null});
  },

  unmount: function() {

  },

  notFound: function(message) {
    this.setState({error: 'Not found: ' + message.path});
  },

  authenticationRequired: function() {

  },

  unauthorized: function() {

  },

  info: function(message) {
    var props = this.props;
    var name = message.name;
    var obj = {};
    if (name === 'event') obj = props.events || {};
    var data = message.data || {};
    var call = obj[data.type];
    if (call) call(data.props);
  },

  call: function(message, cb) {

  },

  error: function(message) {
    this.setState({error: message.info});
  }
});
