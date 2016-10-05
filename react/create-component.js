module.exports = function(proto, react) {
  var createElement = react.createElement;
  var types = react.PropTypes;

  var _render = proto.render;

  var mixins = proto.mixins = proto.mixins || [];
  mixins.unshift(require('./mixins/stream'));

  return react.createClass(Object.assign({}, proto, {
    displayName: proto.displayName,

    contextTypes: {
      action: types.func,
      authenticate: types.func,
      tree: types.object
    },

    affordance: function(name) {
      var info = this.props[name];
      if (!info) return fakeAffordance(name);
      var schemas = this.context.tree.schemas;

      var ref = info.ref;
      var fn = schemas[info.schema_id];

      function affordance(data) {
        var res = fn(data);
        res.ref = ref;
        return res;
      }

      affordance.ref = ref;
      affordance.schema = fn.schema;

      return affordance;
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
