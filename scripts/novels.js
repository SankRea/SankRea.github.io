/* global hexo */
'use strict';

let books = [];
let chaptersByPath = new Map();

function fail(message) {
  throw new Error(`[藏书室] ${message}`);
}

hexo.extend.generator.register('novels', function(locals) {
  books = [];
  chaptersByPath = new Map();
  const definitions = locals.data.novels?.books || [];
  const ids = new Set();
  const posts = locals.posts.toArray();

  for (const definition of definitions) {
    const { id, title } = definition;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') || !title) {
      fail('每本作品需要英文小写 id 和 title。');
    }
    if (ids.has(id)) fail(`作品 id 重复：${id}`);
    ids.add(id);
    if (definition.hidden) continue;

    const volumeDefinitions = definition.volumes || [];
    const volumeIds = new Set(volumeDefinitions.map(volume => String(volume.id)));
    if (volumeIds.size !== volumeDefinitions.length) fail(`《${title}》的卷 id 重复。`);
    const chapters = [];
    const positions = new Set();

    for (const post of posts) {
      if (post.novel?.book !== id || post.password || post.novel.hidden) continue;
      const metadata = post.novel;
      const order = Number(metadata.order);
      if (metadata.order === undefined || metadata.order === null || metadata.order === '' || !Number.isFinite(order) || order < 0) {
        fail(`${post.source} 需要有效的 novel.order（非负数字）。`);
      }
      const volumeId = metadata.volume === undefined ? '' : String(metadata.volume);
      const volumeIndex = volumeDefinitions.findIndex(volume => String(volume.id) === volumeId);
      if (volumeDefinitions.length && volumeIndex < 0) fail(`${post.source} 的 novel.volume 不在作品分卷配置中。`);
      if (!volumeDefinitions.length && volumeId) fail(`请先为《${title}》配置 volumes，或移除章节的 novel.volume。`);
      const position = `${volumeId}:${order}`;
      if (positions.has(position)) fail(`《${title}》有重复的卷内排序：${position}`);
      positions.add(position);
      chapters.push({
        path: post.path,
        title: metadata.title || post.title,
        order,
        volumeId,
        volumeIndex,
        volumeTitle: volumeDefinitions[volumeIndex]?.title || '正文'
      });
    }

    chapters.sort((a, b) => a.volumeIndex - b.volumeIndex || a.order - b.order);
    const volumeList = volumeDefinitions.length ? volumeDefinitions : [{ id: '', title: '正文' }];
    const book = {
      id,
      title,
      subtitle: definition.subtitle || '',
      author: definition.author || hexo.config.author,
      description: definition.description || '',
      status: definition.status || '收录中',
      note: definition.note || '',
      path: `novels/${id}/`,
      chapters,
      count: chapters.length,
      first: chapters[0],
      latest: chapters[chapters.length - 1],
      volumes: volumeList.map(volume => ({
        title: volume.title,
        chapters: chapters.filter(chapter => chapter.volumeId === String(volume.id))
      })).filter(volume => volume.chapters.length)
    };
    books.push(book);
    chapters.forEach((chapter, index) => {
      chaptersByPath.set(chapter.path, {
        book,
        chapter,
        index: index + 1,
        previous: chapters[index - 1],
        next: chapters[index + 1]
      });
    });
  }

  const pageDefaults = { comments: false, toc: { enable: false }, lang: hexo.config.language };
  return [
    {
      path: 'novels/index.html',
      layout: 'novel-library',
      data: { ...pageDefaults, title: '藏书室', books, chapterCount: books.reduce((sum, book) => sum + book.count, 0) }
    },
    ...books.map(book => ({
      path: `${book.path}index.html`,
      layout: 'novel-book',
      data: { ...pageDefaults, title: book.title, description: book.description, book }
    }))
  ];
});

hexo.extend.helper.register('novel_chapter', function(post) {
  return post && chaptersByPath.get(post.path);
});

hexo.extend.helper.register('novel_client_data', function() {
  // Only public chapter paths and display titles enter the browser-side catalogue.
  return JSON.stringify(books.map(book => ({
    id: book.id,
    title: book.title,
    chapters: book.chapters.map(chapter => ({
      path: chapter.path,
      title: chapter.title,
      url: this.url_for(chapter.path)
    }))
  })));
});
