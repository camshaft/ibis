var React = require('react');
var createElement = React.createElement;
var types = React.PropTypes;
var URL = require('url');
var Emitter = require('events');

var Application = module.exports = React.createClass({
  displayName: 'Application',

  componentWillMount: function() {
    var self = this;
    var props = self.props;
    self.streams = new Emitter();
    self.client = props.createClient(props.src, props.props, self);
    if (process.env.NODE_ENV == 'development') {
      this.history = [];
      this.tt = function tt(i) {
        if (i >= this.history.length) throw Error('History out of bounds');
        this.setState({tree: this.history[i]});
      };
    }
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
    appSrc: types.string,
    streams: types.object
  },

  getChildContext: function() {
    var client = this.client;
    var props = this.props;
    return {
      action: client.action,
      authenticate: client.authenticate,
      tree: this.state.tree,
      transclude: this.transclude,
      appSrc: props.src,
      streams: this.streams
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
        0: { // components
          $root: null
        },
        1: {} // schemas
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
      state.tree[0].$root;
  },

  // client callbacks
  mount: function(message) {
    var init = process.env.NODE_ENV == 'development' ?
      this.history[0] :
      this.state.tree;

    var tree = message.body(init);

    if (process.env.NODE_ENV == 'development') this.history.unshift(tree);

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
    var self = this;
    var props = self.props;
    var name = message.name;
    var data = message.data || {};
    var obj = {};
    if (name === '_emit') {
      var streams = self.streams;
      return Object.keys(data).forEach(function(id) {
        data[id].forEach(function(event) {
          streams.emit(id, event);
        });
      });
    }
    if (name === 'event') obj = props.events || {};
    var call = obj[data.type];
    if (call) call(data.props);
  },

  call: function(message, cb) {

  },

  error: function(message) {
    this.setState({error: message.info});
  }
});
