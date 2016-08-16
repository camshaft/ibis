module.exports = function(proto, react) {
  var createElement = react.createElement;
  var types = react.PropTypes;

  var _render = proto.render;

  return react.createClass(Object.assign({}, proto, {
    displayName: proto.displayName,

    contextTypes: {
      action: types.func,
      authenticate: types.func,
      tree: types.object
    },

    affordance: function(name) {
      var affordance = this.props[name];
      if (!affordance) return fakeAffordance(name);
      var schemas = this.context.tree.schemas;
      return affordance(schemas);
    },

    action: function(name) {
      var self = this;
      return function(changeset, done) {
        return function(evt) {
          if (evt) evt.preventDefault();
          var action = self.context.action;
          action(changeset.ref, changeset.data, done);
        };
      };
    },

    bindTargetValue: function(name) {
      return function(evt) {
        this.setState({[name]: evt.target.value});
      }.bind(this);
    },

    render: function() {
      var self = this;
      var val = _render.call(self, createElement, null, self.props, self.state || {});
      return Array.isArray(val) ?
        createElement.apply(null, ['div', null].concat(val)) :
        val;
    }
  }));
};

function fakeAffordance(name) {
  return function(data) {
    return {
      isValid: false,
      data: data
    };
  };
}
