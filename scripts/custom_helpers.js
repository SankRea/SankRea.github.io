hexo.extend.helper.register('get_recent_posts', function() {
  if (this.site && this.site.posts) {
    return this.site.posts.sort('date', -1).limit(5).toArray();
  }
  return [];
});