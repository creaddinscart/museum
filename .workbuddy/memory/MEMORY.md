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

## 业务口径（重要）

- **博物馆有 shop**：首页欢迎语与 about 页均改为欢迎"报价 / 下单 / 交期"邮件，
  不再写 "The museum does not have a shop"。新增 `shop.html`（邮件询价下单流程），
  顶层页共 8 个。改动 ICU 文案请同步 `build.js`，不要只改生成结果。
- 旧版中文「数字博物馆」（703 站、21 展区、assets/ + tools/ 结构）**已废弃**，
  仅存在于 git 历史（tag 无，提交 bac6322 及之前）。

## 工程注意

- 仓库根目录即 GitHub Pages 发布根（CNAME = m.shit.pub，有 .nojekyll）。
- git 历史里 assets/js/app.js 硬依赖一批 DOM id，改 HTML 时如引用旧版需同步。
- 旧版 tools/smoke-test.js 需用 macOS 自带 JavaScriptCore（jsc）运行，Node 跑不了
  （用了 print()/load()）。

## 沟通偏好

- 用户中文交流，反馈直接、语气急；改版前先确认"哪一版是想要的"，别自作主张回退。
