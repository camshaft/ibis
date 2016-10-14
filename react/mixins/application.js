module.exports = function(React) {
  var types = React.PropTypes;

  return {
    contextTypes: {
      action: types.func,
      authenticate: types.func,
      tree: types.object
    },

    affordance: function(name) {
      var info = this.props[name];
      if (!info) return fakeAffordance(name);
      var schemas = this.context.tree[1];

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
  };
}

function fakeAffordance(name) {
  return function(data) {
    return {
      isValid: false,
      data: data
    };
  };
}
