var createActionFactory = require('../action');
var assign = require('object-assign');

var slice = [].slice;

module.exports = function(component, React) {
  var render = component.render;
  var createElement = React.createElement;
  var isValidElement = React.isValidElement;

  var actionMixin = {
    contextTypes: {
      send: React.PropTypes.func
    },
    componentWillMount: componentWillMount,
    getInitialState: function() {
      return {};
    }
  };

  function DOM(tag, props, children) {
    var a = arguments;

    if (tag === 'json') {
      if (process.env.NODE_ENV === 'production') {
        a = [false];
      } else {
        a = [
          'pre',
          props,
          JSON.stringify(children, null, '  ')
        ];
      }
    }

    return createElement.apply(null, a);
  };

  return React.createClass(assign({}, component, {
    mixins: [actionMixin],
    render: function() {
      var props = this.props;

      function _yield(name, context) {
        var prop = props[name || 'children'];
        if (typeof prop !== 'function') return prop;

        var args = slice.call(arguments, 2);
        return prop.apply(context, args);
      }

      var el = render.apply(this, [
        DOM,
        null,
        props,
        this.state || {},
        _yield,
        {},
        {},
        {},
        function(){},
        {}
      ]);

      return isValidElement(el) ? el : createElement('div', null, el);
    }
  }));
};

function componentWillMount() {
  var self = this;

  var createAction = createActionFactory({
    submit: function(changeset, cb) {
      return self.context.send(changeset, cb);
    }
    // TODO
    //cancel: function() {
    //  clearTimeout(id);
    //}
  }, function(client, name) {
    if (!self.isMounted()) return null;
    if (!name) return self.forceUpdate();
    var nextState = {};
    nextState[name] = client;
    return self.setState(nextState);
  });

  self.$action = function(name) {
    if (!name) return createAction();
    var state = self.state;
    return state[name] = state[name] || createAction(name);
  };
}
