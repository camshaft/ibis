var assign = require('object-assign');

var slice = [].slice;

module.exports = function(component, React) {
  var render = component.render;
  var createElement = React.createElement;
  var isValidElement = React.isValidElement;

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

  // TODO setup 'createAction' here with the client

  return React.createClass(assign({}, component, {
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
