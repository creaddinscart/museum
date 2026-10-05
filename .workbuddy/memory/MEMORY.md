# museum 项目备忘（m.shit.pub）

## 站点定位与风格（重要，勿再搞反）

- 现行版本是**复古英文风格**「Digital Museum of Professional Websites」，
  仿 plugsocketmuseum.nl（"Digital Museum of Plugs and Sockets"）：
  白底、Times 衬线、`<hr width="720">` 分隔、table 布局、蓝链/紫访问链、
  紫红色大号 ENTER MUSEUM、`<font size="2">` 灰色小字。
## 现行结构（多页静态站）

- `sites.js` = 唯一真值数据源（`window.MUSEUM_SITES`，cat/name/url/desc）。
  改内容只改这个文件，然后 `node build.js` 重新生成，**不要手改 HTML**。
- `build.js`（node）生成 312 个页面：顶层 12 页 + `categories/<cat>.html` 47 个展区页
  + `countries/<slug>.html` 250 个国家页。页面全静态，禁用 JS 也能完整浏览；
  `ROOM_NOTE` 是各展区导读文案。
- `live.html` 是唯一依赖 JS 的页面：浏览器直连 CoinGecko / Frankfurter /
  Hacker News / USGS / Open-Meteo / wheretheiss.at / NASA APOD，60 秒自动刷新。
  股指与大宗商品没有可用的免密钥 CORS 源，不要再去试 Stooq / Yahoo / Binance。
- **第三个数据源** `countries.js`（`window.MUSEUM_COUNTRIES`，250 条）供国家馆用。
  由 mledoze/countries（旧 schema，无人口）+ 世界银行 API（人口/GDP/寿命）合并生成，
  地图链接由经纬度推导。**restcountries.com 已全线停服，不要再试。**
- **第二个数据源** `relics.js`（`window.MUSEUM_RELICS`，29 件真实文物）供 `gallery.html` 用。
  字段 name/museum/place/period/site/file/source/license/credit/note/copy；
  `site`=博物馆官网，`source`=Commons 原图页，`copy:true`=复刻品（页面打 replica 标）。
  图片存本地 `gallery/`（不外链，统一 960 宽）。
- `script.js` 仅做渐进增强（sites.html 实时筛选，`/` 聚焦、Esc 清空）。
- `sitemap.xml` 由 build.js 生成，勿手改。

## 提交机制（2026-10-04 用户要求撤销在线表单）

- **站内不设上传表单**，一律改走三个渠道，`contact.html` 上列出来：
  - Discord `https://discord.com/invite/ZJemMBsm`
  - QQ `https://qm.qq.com/q/4nyFIEjn04`
  - Email `mail@shit.pub`
  - 渠道写在 build.js 的 contact 块 `channels` 数组里。
- 旧的 `submit.html` / `submissions.html` 与 localStorage 访客条目机制（
  `museum.guests.v1`、`renderGuests()`）**已全部删除**，script.js 只剩筛选 + 导航高亮。

## 业务口径（重要）

- ~~shop~~ **已下线**（2026-10-04 用户要求撤销）。替代品是 `exhibition.html`，
  nav 标签为**中文「展厅」**（用户明确指定，勿改回英文）。
## 语言口径（硬性）

- **站页面文案一律英文，不要出现中文**（2026-10-04 用户明确要求 "不要有中文全部英语"）。
  包括导航标签、标题、正文、联系提示。只有站点以外的交流可以用中文。
- 邮箱下方的联系提示现用英文：
  "Questions, corrections and sites sent in bulk are all welcome."
  （index 欢迎区 / about 页 Contact / exhibition 页底部 / 404 页四处，改在 build.js。）
- 升级/改动后可自查：`node build.js` 后用 Python 正则 `[　-〿一-鿿＀-￯]` 扫全部
  *.html + categories/*.html，命中行数应为 0。
- 旧版中文「数字博物馆」（703 站、21 展区、assets/ + tools/ 结构）**已废弃**，
  仅存在于 git 历史（tag 无，提交 bac6322 及之前）。

## 工程注意

- 仓库根目录即 GitHub Pages 发布根（CNAME = m.shit.pub，有 .nojekyll）。
- **本沙箱里 Bash 的 `grep` 不可靠**（有匹配也返回空），查文件内容用 Grep 工具。
- 图片处理用 macOS 自带 `sips`（无需装 Pillow）：
  `sips -s format jpeg -s formatOptions 82 --resampleWidth 960 in --out out.jpg`。
- Wikimedia Commons 抓图必须按标题过滤 + 判空；长卷类要挑 detail 图并校验宽高比，
  否则会拿到细长条或完全错误的照片。
- git 历史里 assets/js/app.js 硬依赖一批 DOM id，改 HTML 时如引用旧版需同步。
- 旧版 tools/smoke-test.js 需用 macOS 自带 JavaScriptCore（jsc）运行，Node 跑不了
  （用了 print()/load()）。

## 沟通偏好

- 用户中文交流，反馈直接、语气急；改版前先确认"哪一版是想要的"，别自作主张回退。
