var React = require('react');
var types = React.PropTypes;

module.exports = {
  contextTypes: {
    streams: types.object
  },

  componentWillMount: function() {
    this._streams = {};
  },

  on: function(propName, cb) {
    var _streams = this._streams;
    if (_streams[propName]) _streams[propName].off();
    var obj = _streams[propName] = {
      cb: cb,
      off: noop
    };
    var ref = obj.ref = this.props[propName];
    if (!ref) return null;
    var streams = this.context.streams;
    streams.on(ref, cb);
    obj.off = function() {
      streams.removeListener(ref, cb);
    };
  },

  componentWillReceiveProps: function(newProps) {
    var streams = {};
    var stream, newRef;
    for (var k in streams) {
      stream = streams[k];
      newRef = newProps[k];
      if (stream.ref === newRef) continue;
      stream.off();
      this.on(newRef, stream.cb);
    }
  },

  componentWillUnmount: function() {
    var streams = this._streams;
    for (var k in streams) {
      streams[k].off();
    }
  }
};

function noop(){}
