module.exports = function(doc, opts) {
  opts = opts || {};
  var styles = {};

  var styleContainer = doc.head;

  function put(key, css) {
    var style = styles[key];
    if (!style || !style.parentElement) {
      style = styles[key] = doc.createElement('style');
      style.type = 'text/css';
      styleContainer.appendChild(style);
    }
    setStyle(style, css, key);
  }

  function remove(key) {
    var style = styles[key];
    if (style) styleContainer.removeChild(style);
    delete styles[key];
  }

  return function updateStyle(key, css) {
    css ? put(key, css) : remove(key);
  };
};

function setStyle(styleElement, css, key) {
  css += "\n\n/*# sourceURL=thot://" + key.replace(/\*\//, '*\\/') + "*/";

	if (styleElement.styleSheet) {
		styleElement.styleSheet.cssText = css;
	} else {
		while (styleElement.firstChild) {
			styleElement.removeChild(styleElement.firstChild);
		}
		styleElement.appendChild(document.createTextNode(css));
	}
}
