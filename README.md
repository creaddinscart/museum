# 数字博物馆 · m.shit.pub

收藏全球 703 个真正有价值的网站，分 21 个展区陈列，免费公开。

- 线上地址：<https://m.shit.pub>
- 托管：GitHub Pages（仓库根目录发布）

## 页面长什么样

打开页面正中是一个圆环：圆心是博物馆，21 个展区围成一圈。点任意展区，
下方列出该展区的网站。顶部一行是搜索框。

- **搜索**：站名、简介、标签、域名一起搜，按相关度排序，命中的字会高亮。
  支持多关键词（空格分隔，全部命中才算），结果里给出总数。按 `/` 聚焦搜索框，
  按 `Esc` 清空。
- **国家 / 地区**：首次进入必须选择所在地。存在浏览器 `localStorage`，
  也可以直接用 `?c=CN` 这样的链接指定。
- **深链**：`?view=games` 打开某个展区，`?q=开源` 直接带搜索词进站，三者可以组合。
- **收藏**：点条目右侧的 ☆，存在自己的浏览器里。

## 加密货币展区怎么受限

名单在 `assets/js/data-base.js`：

- `CRYPTO_BLOCKED`（中国、阿富汗、阿尔及利亚、孟加拉国、玻利维亚、埃及、伊拉克、
  摩洛哥、尼泊尔、北马其顿、卡塔尔、突尼斯、瓦努阿图、伊朗、科威特、巴林、沙特、
  约旦、黎巴嫩、阿曼、巴基斯坦、叙利亚、也门）—— 整个展区不展示，并给出说明。
- `CRYPTO_WARN`（土耳其、尼日利亚、印尼、印度、俄罗斯、越南）—— 照常展示，
  但顶部提示当地法规风险。

## 搜索引擎能不能收录

能。`index.html` 里带了：

- 语义化标签（`header` / `nav` / `main` / `section` / `footer`）与唯一的 `h1`
- `title`、`description`、`canonical`、Open Graph
- 两段 JSON-LD：`WebSite`（带 `SearchAction`）与 `CollectionPage` + `ItemList`（21 个展区）
- `<noscript>` 里一份完整静态目录，**703 个站点的链接全部是真链接**，
  不执行 JS 的爬虫也能抓到

`sitemap.xml` 列出首页 + 21 个展区的 `?view=` 地址。`robots.txt` 指向它。

## 目录结构

```
.
├── CNAME                     # m.shit.pub
├── .nojekyll                 # 关掉 Jekyll，保证 assets/ 原样发布
├── index.html                # 唯一入口：国家选择 + 博物馆（含 noscript 目录）
├── robots.txt
├── sitemap.xml               # 由 tools/build_seo.py 生成
├── tools/
│   ├── validate-data.py
│   ├── check-links.py
│   ├── dedupe.py
│   ├── build_seo.py
│   └── smoke-test.js
└── assets/
    ├── icon.svg              # 2D 博物馆图标（自绘）
    ├── favicon.svg           # 标签页图标（自绘）
    ├── css/style.css
    └── js/
        ├── data-base.js      # 国家列表、加密货币受限名单
        ├── data-01-culture.js   # 文博 / 文献 / 教育 / 科学
        ├── data-02-games.js     # 游戏 / 影视 / 音乐 / 图像
        ├── data-03-dev.js       # 开发 / 智能 / 工具 / 数据
        ├── data-04-money.js     # 金融 / 加密 / 新闻 / 政务
        ├── data-05-life.js      # 公益 / 健康 / 搜索 / 趣味 / 航天
        └── app.js
```

## 代码约定

- 所有代码、注释、变量名、工具输出一律英文；**代码里不写注释**。
  页面上面向读者的中文只出现在数据和 HTML 文案里。
- 纯静态：原生 HTML/CSS/JS，无框架、无构建步骤、无依赖、无外部请求、无埋点。
- 样式是维基风格：白底、蓝链（访问过变紫）、衬线标题配灰色下划线、
  外链小箭头。没有圆角、阴影、渐变、深色模式。

## 新增一个展区

在 `assets/js/data-0X-*.js` 里追加：

```js
MUSEUM_CATEGORIES.push({
  id: "heritage",
  short: "文博",
  name: "博物馆与文化遗产",
  note: "一句话说明这个展区收录什么",
  restricted: false,
  sites: [
    ["卢浮宫", "https://www.louvre.fr", "巴黎卢浮宫官网，可在线浏览约 48 万件馆藏。", "法国", "fr", ["艺术", "馆藏"]],
  ]
});
```

`short` 是环形导航上的 2 字简称，21 个展区各用一个，不能重复 ——
圆环一圈要排得下，长名字会互相压住，校验脚本会盯着这一点。

新增文件记得加进 `index.html` 底部的 `<script>` 列表（放在 `app.js` 之前）。

## 维护工具

都只用 Python 3 标准库，不需要装依赖。在仓库根目录运行：

```sh
python3 tools/validate-data.py     # 数据格式、字段、6 元组、链接、展区间去重
python3 tools/check-links.py       # 链接体检（curl，并发 + 串行复检）
python3 tools/check-links.py 02    # 只体检 data-02-games.js
python3 tools/dedupe.py --dry      # 跨展区去重，先看会删什么
python3 tools/build_seo.py         # 重新生成 noscript 目录、JSON-LD、sitemap.xml
```

`dedupe.py` 顶部的 `RULES` 是「某个网址归哪个展区」的归属表，
新增展区撞车时往表里加一行、跑一次即可。

改完数据后记得跑 `build_seo.py`，否则页面底部的静态目录还是旧的。

冒烟测试用 macOS 自带的 JavaScriptCore 执行真实的 `app.js`
（带一套 DOM 桩，会模拟选地区、点圆环、输入搜索、收藏）：

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc \
    tools/smoke-test.js
```

它还会算一遍圆环的几何：节点间距必须大于标签宽度，桌面和手机两种尺寸都验。

## 本地预览

```sh
python3 -m http.server 8000
```

## 部署

推到 GitHub 后，在仓库 **Settings → Pages** 里把 Source 设为 `Deploy from a branch`，
分支选 `main`、目录选 `/ (root)`。根目录的 `CNAME` 会让它绑定到 `m.shit.pub`。

DNS 侧需要配置：

```
m.shit.pub.  CNAME  <你的用户名>.github.io.
```

## 免责声明

本站只做收录与介绍，不构成任何投资建议。所有站点运行在各自域名下，
内容与版权归原作者所有。
