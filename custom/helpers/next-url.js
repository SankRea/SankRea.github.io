'use strict';

const { htmlTag } = require('hexo-util');
const { URL } = require('node:url');

module.exports = function(path, text, options = {}, decode = false) {
  const { config, theme } = this;
  // No base: relative paths, anchors and protocol-relative links stay internal.
  const data = URL.parse(path);
  const siteHost = new URL(config.url).hostname;
  const isExternal = data !== null && data.hostname !== siteHost;

  let exturl = '';
  let tag = 'a';
  let attrs = { href: this.url_for(path) };

  // If `exturl` enabled, set spanned links only on external links.
  if (theme.exturl && isExternal) {
    tag = 'span';
    exturl = 'exturl';
    const encoded = Buffer.from(path).toString('base64');
    attrs = {
      class     : exturl,
      'data-url': encoded
    };
  }

  for (const key in options) {

    /**
     * If option have `class` attribute, add it to
     * 'exturl' class if `exturl` option enabled.
     */
    if (exturl !== '' && key === 'class') {
      attrs[key] += ' ' + options[key];
    } else {
      attrs[key] = options[key];
    }
  }

  // If it's external link, rewrite attributes.
  if (isExternal) {
    attrs.external = null;

    if (!theme.exturl) {
      // Only for simple link need to rewrite/add attributes.
      attrs.rel = attrs.rel || 'noopener';
      attrs.target = '_blank';
    } else {
      // Remove rel attributes for `exturl` in main menu.
      attrs.rel = null;
    }
  }

  return htmlTag(tag, attrs, decode ? decodeURI(text) : text, false);
};
