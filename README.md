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
- 首页当前只展示《欢迎来到黑蜥蜴星球》，隐藏其他文章和分页按钮，保留导航、侧栏与音乐。该设置由 `_config.next.yml` 的 `home_welcome_post` 指定文章 `abbrlink`；删除此项即可恢复首页文章列表。首页分支独立保存在 `custom/layout/index.njk`，归档、分类和藏书室保持原样。
- 站点地址、永久链接及部署设置在 `_config.yml`。
- 个人主题配置在 `_config.next.yml`；`themes/next/_config.yml` 保留上游默认值。
- 自定义页面模板在 `custom/layout`，注入入口和内容数据在 `source/_data`，样式统一放在 `source/css`，浏览器脚本放在 `source/js`。
- 个人头像已移到 `source/images`，原有网址不变。以后新增个人图片也放在这里，主题提供的其他图标资源仍在 `themes/next/source/images`。
- 站点图标使用 `source/images/black-lizard/` 中的黑蜥蜴星球设计：SVG 原稿、16/32/48 像素 PNG、三尺寸 ICO、180 像素 Apple Touch 图标和 Safari 单色图标；另提供 192/512 像素 PNG 供后续复用。入口在 `_config.next.yml` 和 `source/_data/head.njk`，不覆盖主题资源。
- 修改 `source/images/black-lizard/icon.svg` 后，可在 Windows PowerShell 中运行 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ./tools/export-site-icons.ps1` 导出配套图标；此命令只生成图片资源，不运行 Hexo 构建。
- `themes/next` 是纳入版本管理的主题源码。首页、小说页与 URL 兼容修改已从主题文件移出，由 `scripts/site-customizations.js` 在生成前注册项目模板与 helper。

播放器和背景动画由 `source/js/site-media.js` 在首屏绘制后、浏览器空闲时从固定版本 CDN 地址加载：

| 资源 | 版本 |
| --- | --- |
| APlayer | 1.10.1 |
| Canvas Nest | 1.0.1 |

播放器仍使用 APlayer，歌单通过 Meting API 获取，由站点脚本直接处理请求、错误和初始化，不再加载 MetingJS。
站点地图由 `hexo-generator-sitemap` 生成。

## 首页加载与音乐维护

- 搜索索引在打开搜索时下载，`_config.next.yml` 中的 `local_search.preload` 设为 `false`。
- `custom/helpers/font.js` 复用 NexT 的字体配置，将字体样式表改为非阻塞加载，并保留 `display=swap` 和无 JavaScript 时的回退。页面先显示本机字体，外部字体加载后切换。
- 点击爱心和 Canvas Nest 在首屏绘制后的空闲时段加载；初次加载时处于手机窄屏、减少动态效果、省流量、慢速网络或小说专注模式时跳过。爱心不再维持空闲动画循环。
- `wobblewindow.js` 目前没有使用位置，保留源文件但不再全站加载。
- 音乐脚本和样式也延后加载；省流量或慢速网络下需点击“加载音乐”。音频设为 `preload: none`、关闭自动播放，站内 PJAX 跳转保留播放器。

歌单接口在 `source/_data/body-end.njk` 的 `data-api` 中配置，目前使用
`https://api.injahow.cn/meting/?server=netease&type=playlist&id=475964653`。
更换歌单时同步修改接口中的 ID 和“在网易云打开”链接；更换服务时使用支持 HTTPS、CORS 的 Meting 兼容接口。

APlayer 的歌词默认隐藏，可通过播放器的歌词按钮打开。音频保持 `preload: none`。`source/js/site-media.js` 中的 `excludedTrackIds` 按平台和歌曲 ID 提前过滤已确认的短资源，过滤发生在创建播放器之前，首次访问也不会请求这些歌曲的音频、封面和歌词。2026-09-11 本地报告共检测 235 首，其中 149 首不足一分钟（114 首 30 秒、35 首 45 秒）已加入名单；83 首达到一分钟，3 首检测失败未加入名单。固定名单不会自动过期，资源恢复完整版后需重新检测并手动移除对应 ID。

当前 Meting 歌单不返回时长；名单外的歌曲在选中音频读到实际时长后继续判断：不足 60 秒（含短试听资源）立即停止下载并移出列表，原本正在播放时继续下一首。这些动态识别的短资源在当前浏览器缓存 24 小时，下次加载歌单时直接过滤，过期后重新判断。不逐首预加载整张歌单，首次识别未知资源仍会产生读取音频元数据的流量。

2026-09-09 只读排查中，原默认接口 `api.i-meto.com` 请求超时，而上述接口返回 HTTP 200、235 首歌曲及允许跨域的响应头。
新脚本为资源和歌单请求设置 12 秒超时，提示网络异常、返回格式错误或空歌单，并提供重试和网易云歌单链接。
兼容接口中的 `cover` / `pic` 封面字段。公共 API 的长期可用性与单曲播放权限仍由服务提供方、音乐平台决定；
此次仅检查接口响应与一首歌曲的响应头，未进行浏览器播放、构建或测试，也未测量性能提升幅度。

## 本地检查歌单时长

运行歌单时长检查（可选，仅本地手动运行）：

```powershell
node tools/check-music-duration.mjs
```

打开 `http://127.0.0.1:8788/`，点击“开始检测”。工具只需要现有 Node 和浏览器，不安装额外依赖，也不启动 Hexo。它直接获取配置中的完整歌单，使用浏览器读取实际音频资源时长，不播放音乐，不受博客短曲缓存影响。默认同时检测 2 首、单次超时 25 秒，失败重试一次；可在页面调整。请保持页面在前台，检测过程中可能下载部分或较多音频数据。

结果逐首写入 `reports/music-duration/日期时间/`：`results.json` 包含歌曲 ID、URL、完整精度秒数及失败原因，用于后续编写博客过滤名单；`short-tracks.txt` 是不足 60 秒的歌曲名称名单；`all-tracks.csv` 可用 Excel 查看完整结果。小于 60 秒才算短曲，失败和待检测项不会算入。点击暂停会等待当前歌曲结束并保存；本地服务未退出时，可继续检测或刷新页面后继续。退出并重新运行会建立新报告，不覆盖上次结果。报告目录已加入 Git 忽略，不会自动发布。

检查完后将 `results.json` 提供给维护者，再单独更新博客过滤名单。该工具不自动修改博客歌单。实际资源可能是短试听版本，报告只代表检测时接口返回的音频。终端按 Ctrl+C 退出；端口被占用可加 `--port 8790`。

## 手机适配与欢迎页语言

手机上的菜单、阅读按钮提供更大的触控区域；菜单在跳转后自动收起，也支持键盘操作。
阅读工具栏按窄屏分行，章节目录限制在可视高度内；恢复阅读位置时按实际工具栏高度计算，避免正文被遮住。
音乐加载提示或播放器挂载后，按实际高度为页面底部留空，并避让系统安全区域；侧栏按钮和返回顶部按钮跟随上移。

欢迎文章的标题与正文按 `navigator.languages` 的优先顺序切换：简体中文、繁体中文、英文，未匹配时回退英文。
`zh-Hans`、`zh-CN`、`zh-SG` 使用简体；`zh-Hant`、`zh-TW`、`zh-HK`、`zh-MO` 使用繁体。
网页读取的是浏览器语言偏好，通常跟随系统，但浏览器的独立语言设置可能覆盖它；不使用 IP 定位或在线翻译服务。
文案在 `source/_data/welcome.yml`，行为在 `source/js/site.js`。修改欢迎文章时需同步这份翻译数据。
切换仅影响首页欢迎卡片及该文章详情，导航和小说正文保持原有语言。禁用 JavaScript 时显示原始 Markdown 文案。

## 自定义功能与主题升级

| 位置 | 用途 |
| --- | --- |
| `custom/layout/*.njk` | 首页、文章入口、藏书室、阅读页及复用的局部模板 |
| `custom/helpers/next-url.js` | WHATWG URL API 兼容 helper |
| `custom/helpers/font.js` | 外部字体样式表的非阻塞加载 |
| `scripts/site-customizations.js` | 在 NexT 初始化后通过 `theme.setView` 注册模板，并注册 URL helper |
| `scripts/novels.js` | 小说目录生成和章节关联 |
| `source/css/site.css`、`source/js/site.js` | 全站外观、手机适配与欢迎页语言切换 |
| `source/js/site-media.js` | 音乐请求与错误提示、播放器和装饰特效的延后加载 |
| `source/css/novels.css`、`source/js/novels.js` | 小说阅读界面与进度保存 |
| `source/_data`、`source/images` | 注入入口、内容配置和个人图片 |

升级 NexT 时保留以上目录与 `_config.next.yml`。项目模板在内存中覆盖视图，不改写主题文件。
自定义视图之间使用 Hexo `partial()`，主题自带的基础布局和侧栏宏继续从 NexT 加载。
跨主题版本升级仍需检查 `custom/layout/index.njk`、`post.njk` 与上游布局接口的兼容性。
修改 `custom/` 或 `scripts/` 后重启 `hexo s`；这些目录不依赖主题目录的文件监听。

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
小说模板集中在 `custom/layout`，按上面的“自定义功能与主题升级”说明维护。

## 首页史尔特尔小人

欢迎首页加入泳装史尔特尔（`350_surtr_summer#9`）基建小人，桌面端空闲时自动加载；手机、节省流量或减少动态效果模式下，点击“召唤史尔特尔”加载。加载后默认播放，可拖动位置、点击互动和收起；位置和收起状态保存在当前浏览器。其他页面隐藏，切到后台停止动画。

实现位于 `source/js/ark-pet.js` 和 `source/css/ark-pet.css`，由 `source/_data` 中的页面扩展引入。角色资源位于 `source/models/surtr-summer/`，固定版本播放器位于 `source/lib/ark-pet/`，均从本站加载；无需额外安装 npm 包。来源、版本及许可见两个目录内的 `CREDITS.txt`、`SOURCES.txt` 和许可证文件。

模型来源为 Ark-Models，角色与美术版权归鹰角网络；播放器另受 PixiJS 与 Spine 运行库许可约束。

小人在页面底部的安全区域随机行走、坐下或躺下，行走碰到左右边界会转向。拖动后松手会受模拟重力影响下落，落地后恢复待机；底部为音乐播放器预留空间。目前不包含侧栏、卡片顶部的平台碰撞。点击小人会打断当前活动并执行互动动作，结束后恢复待机。下方“走一走 / 坐下 / 躺下”按钮默认隐藏，鼠标悬停在小人区域时显示；手机轻点小人展开，再次轻点或点击外部收起，键盘聚焦小人也可显示。缺失的模型动作会禁用对应按钮。离开首页或切到后台时，动画、重力和行为计时一起停止。

戳一戳同时随机播放史尔特尔日文语音，包含交谈 1–3、闲置、戳一下、信赖触摸、问候七句，避免连续重复。语音首次点击才加载，连续点击会停止上一句，只播放最新一次；拖动、自动活动和动作按钮不触发语音。顶部名称、语音开关和关闭按钮与下方动作按钮一起默认隐藏，悬停、手机轻点展开或键盘聚焦时显示。“语音开 / 已静音”开关记住访客选择，关闭小人、切页或切到后台都会停止语音。

语音来自 Ark-Voice 固定版本，原始 OGG 和分句索引保存在 `source/models/surtr-summer/voice-jp.ogg`、`voice-jp.json`。浏览器使用 Web Audio 解码后只缓存选中的片段，不依赖轮询来截断整段音频；来源及版权见同目录 `CREDITS.txt`。若浏览器不支持该 OGG 编码或加载失败，会显示提示，动画仍可使用。

手动查看：重启 `hexo s` 后打开首页；将小人拖到高处松手，观察落地；尝试悬停显示动作按钮、手机轻点展开和戳一戳，并检查语音单句播放、连续点击、静音记忆、切页停止、窗口缩放以及关闭后重新召唤。此功能尚未运行构建或浏览器验证。

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
