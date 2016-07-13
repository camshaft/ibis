var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
var length = chars.length;

function charsForInt(i) {
  var s = '';
  do {
    s += chars.charAt((i - 1) % length);
    i = Math.floor(i / length);
  } while(i > 1);
  return s;
}

module.exports = function(idLength, seed) {
  seed = seed || 1;
  idLength = Math.pow(10, idLength || 5) + '';

  function prcg() {
    var digits = Math.sin(seed);
	  digits *= Math.pow(10, 5);
	  digits = digits - Math.floor(digits);
	  seed++;
	  var idx = Math.floor(digits * length);
    return chars.charAt(idx);
  }

  var i = 1;
  return function() {
    return idLength.replace(/\d/g, prcg) + charsForInt(i++);
  };
};
