module.exports = function(proto, react) {
  var createElement = react.createElement;

  var _render = proto.render;

  var mixins = proto.mixins = proto.mixins || [];
  mixins.unshift(require('./mixins/stream'));
  mixins.unshift(require('./mixins/application')(react));

  return react.createClass(Object.assign({}, proto, {
    displayName: proto.displayName,

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
