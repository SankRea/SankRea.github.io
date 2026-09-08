# 黑蜥蜴星球

基于 Hexo 8.1.2 和 NexT 8.29.0 的个人博客。

## 环境与启动

项目约定使用 Node.js 24.18.0、npm 12.0.1；Node 版本同时记录在 `.nvmrc` 中。
`.npmrc` 使用与锁文件一致的 npmmirror 源，无需修改全局 npm 配置。

首次获取项目后，在项目根目录执行：

```powershell
npm.cmd ci
npm.cmd run server
```

浏览器访问 <http://localhost:4000/>。按 `Ctrl+C` 停止服务，之后启动只需执行第二条命令。
Windows PowerShell 中使用 `npm.cmd` 可以避免 `npm.ps1` 执行策略限制；其他终端可以使用 `npm`。

如果已经全局安装 `hexo-cli`，也可以直接使用 `hexo server`，简写为 `hexo s`。
全局 CLI 负责调用项目内的 Hexo，不能替代项目依赖安装。

## 依赖初始化

`package-lock.json` 固定依赖版本，应与 `package.json` 一起提交。
`package.json` 中的 `allowScripts` 保留了 Hexo 工具库及字数统计插件所需的安装脚本许可。

`hexo-word-counter` 的初始化需要下载当前平台的原生模块；如果下载失败，可能尝试从源码编译。
`--ignore-scripts` 会跳过这一步，因此全新安装时不能把该参数当作完整安装方式。
切换 Node 版本或依赖版本前，先停止正在运行的 Hexo 服务。

## 文章、主题与资源

- 文章放在 `source/_posts`。置顶使用 `sticky: 100` 等数字，数值越大越靠前；其余文章按日期倒序排列。
- 站点地址、永久链接及部署设置在 `_config.yml`。
- 个人主题配置在 `_config.next.yml`；`themes/next/_config.yml` 保留上游默认值。
- 自定义模板、样式在 `source/_data`。自定义头像、Logo 和其他图片仍保留在 `themes/next/source/images`。
- `themes/next` 是纳入版本管理的主题源码。更新主题时保留个人配置、自定义图片与额外脚本。
- 主题的 `scripts/helpers/next-url.js` 附带 WHATWG URL API 兼容修补，用于处理 Node.js 24 的弃用警告；再次升级主题时需保留该修补，或确认上游已提供等效修改。

播放器和背景动画通过 `source/_data/body-end.njk` 中的固定版本 CDN 地址加载：

| 资源 | 版本 |
| --- | --- |
| APlayer | 1.10.1 |
| MetingJS | 2.0.2 |
| Canvas Nest | 1.0.1 |

播放器使用 `<meting-js>`，不依赖 `hexo-tag-aplayer`。站点地图由 `hexo-generator-sitemap` 生成。

## 藏书室与小说阅读

重启 `hexo s` 后，从导航的“藏书室”或 `/novels/` 进入。无需安装新依赖。
已接入《泛大陆》和《水族馆的人鱼公主》，每部作品有独立书页、分卷目录、章节导航与浏览器阅读记录。
阅读页提供字号调节、纸张／明亮／夜间配色和专注模式；设置跨作品共用，进度按作品分别保存，不跨设备同步。
点击“继续阅读”恢复位置，直接打开章节时可以点击“回到上次位置”。禁用 JavaScript 时仍可查看目录和正文。

2026-09-08 从纯纯写作 TXT 导入两部作品的章节正文：《泛大陆》第一卷第 1–12 章、
《水族馆的人鱼公主》第一卷“醉后不知天在水”第 1–32 章，共 44 章，不含创作大纲。
此次新增 37 章，更新 1 章正文，其余 6 个已有章节正文保持原样；原有 7 个章节的 `abbrlink` 全部保留。
新增章节使用导入时间作为文章日期，已有章节保留原来的日期字段；阅读目录始终按卷和章号排序。

添加新作品时，在 `source/_data/novels.yml` 的 `books` 列表中增加：

```yaml
  - id: my-new-book
    title: 新作品名称
    author: 作者名
    description: 一句话简介
    status: 连载中
    palette: wine
    volumes:
      - id: 1
        title: 第一卷
```

`id` 使用英文小写字母、数字与连字符，保持稳定，以免改变书页地址和阅读记录。
`palette` 可选 `forest`、`ocean`、`wine`、`sand`；也可填写 `cover: /images/封面.jpg` 使用自己的封面。
`subtitle`、`note` 可选，用来写副标题和收录说明；`author` 未填写时使用站点作者。

随后在该书每个 Markdown 章节的顶部 `---` 区域内增加：

```yaml
novel:
  book: my-new-book
  volume: 1
  order: 1
  title: 第一章 初遇
```

`book` 对应作品 `id`，`volume` 对应卷 `id`。卷按配置顺序排列，章按卷内 `order` 数字排列，不能重复。
不分卷时，省略作品的 `volumes` 和章节的 `volume` 即可。章节显示名优先使用 `novel.title`，原有 `title`、`abbrlink` 和网址可以保留。
不连续收录时填写原章号，并在作品 `note` 中说明；章节导航只连接同一作品中已收录的章节。
这次按公开收录的确认移除了《水族馆的人鱼公主》现有章节的旧 `password` 标记。

作品配置或章节的 `novel` 下设置 `hidden: true` 可以移出藏书室，带 `password` 的章节也不收录。
这些过滤只影响藏书室与阅读模式，不会加密正文或隐藏原来的博客页面；当前项目未安装文章加密插件。

实现文件：`scripts/novels.js` 负责组织作品；`source/css/novels.css`、`source/js/novels.js` 负责阅读界面与浏览器记录。
更新 NexT 时，保留 `layout/novel-library.njk`、`layout/novel-book.njk`、`layout/_macro/novels.njk`、
`layout/_partials/post/novel-reader.njk` 以及 `layout/post.njk` 中的小说分支，同时保留 `source/_data` 中的样式和脚本入口。

## 手动生成与发布

本地预览不需要先生成静态文件。需要发布时，再手动执行：

```powershell
npm.cmd run build
npm.cmd run deploy
```

部署目标仍由 `_config.yml` 控制，当前为 `SankRea/SankRea.github.io` 仓库的 `master` 分支。

## 本次升级记录

- Hexo 从 8.1.1 升至 8.1.2，NexT 从 8.27.0 升至 8.29.0。
- 使用官方 `hexo-generator-index` 替换旧置顶插件，将旧 `top` 字段迁移为 `sticky`。
- 移除百度专用 sitemap、音乐标签、Landscape 及未使用的 npm 背景动画依赖。
- 将个人主题配置独立保存，站点地址统一为 HTTPS，固定播放器 CDN 版本。

本次依赖同步使用了 `--ignore-scripts`，保留现有字数统计原生模块。未编译、未构建、未运行测试或部署；
升级后的页面、搜索、目录、播放器和 PJAX 交互仍需实际预览确认。

上游说明：[Hexo 8.1.2](https://github.com/hexojs/hexo/releases/tag/v8.1.2)、
[NexT 8.29.0](https://github.com/next-theme/hexo-theme-next/releases/tag/v8.29.0)、
[NexT 独立配置](https://theme-next.js.org/docs/getting-started/configuration.html)。
