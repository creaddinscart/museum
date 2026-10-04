# museum 项目备忘（m.shit.pub）

## 站点定位与风格（重要，勿再搞反）

- 现行版本是**复古英文风格**「Digital Museum of Professional Websites」，
  仿 plugsocketmuseum.nl（"Digital Museum of Plugs and Sockets"）：
  白底、Times 衬线、`<hr width="720">` 分隔、table 布局、蓝链/紫访问链、
  紫红色大号 ENTER MUSEUM、`<font size="2">` 灰色小字。
## 现行结构（多页静态站）

- `sites.js` = 唯一真值数据源（`window.MUSEUM_SITES`，cat/name/url/desc）。
  改内容只改这个文件，然后 `node build.js` 重新生成，**不要手改 HTML**。
- `build.js`（node）生成 51 个页面：顶层 7 页 + `categories/<cat>.html` 每展区一页。
  页面全静态，禁用 JS 也能完整浏览；`ROOM_NOTE` 是各展区导读文案。
- `script.js` 仅做渐进增强（sites.html 实时筛选，`/` 聚焦、Esc 清空）。
- `sitemap.xml` 由 build.js 生成，勿手改。

## 访客提交机制

- 站点跑在 GitHub Pages（纯静态、无后端），所以访客提交**存 localStorage
  （`museum.guests.v1`），只对提交者自己可见**，界面已如实说明。
- 访客条目一律**置顶 + 红色 `visitor submission` 标记 + 未验证告示**，
  与已审收藏绝对分区（红框容器），由 `script.js` 的 `renderGuests()` 负责。
- 想让别人也看到 → 必须接后端（Formspree / 云托管 DB），需要用户自己提供 key 或服务。

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
- git 历史里 assets/js/app.js 硬依赖一批 DOM id，改 HTML 时如引用旧版需同步。
- 旧版 tools/smoke-test.js 需用 macOS 自带 JavaScriptCore（jsc）运行，Node 跑不了
  （用了 print()/load()）。

## 沟通偏好

- 用户中文交流，反馈直接、语气急；改版前先确认"哪一版是想要的"，别自作主张回退。
