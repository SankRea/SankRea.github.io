'use strict';

const nextFont = require('../../themes/next/scripts/helpers/font');

module.exports = function() {
  const stylesheet = nextFont.call(this);
  if (!stylesheet) return '';
  // Keep NexT's font settings and display=swap, without blocking the first paint.
  return stylesheet.replace('<link ', '<link media="print" onload="this.media=\'all\'" ')
    + `<noscript>${stylesheet}</noscript>`;
};
