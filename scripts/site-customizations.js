/* global hexo */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const nextUrl = require('../custom/helpers/next-url');
const nextFont = require('../custom/helpers/font');

// NexT finishes registering its own views and helpers before this filter runs.
// Register project templates in memory, leaving the vendored theme files intact.
hexo.extend.filter.register('before_generate', () => {
  if (hexo.config.theme !== 'next') return;
  const directory = path.join(hexo.base_dir, 'custom', 'layout');
  for (const file of fs.readdirSync(directory).filter(file => file.endsWith('.njk'))) {
    hexo.theme.setView(file, fs.readFileSync(path.join(directory, file), 'utf8'));
  }
  hexo.extend.helper.register('next_url', nextUrl);
  hexo.extend.helper.register('next_font', nextFont);
}, 20);
