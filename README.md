# 数字博物馆 · m.shit.pub

收藏全球几百个真正有价值的网站，按展区陈列，免费公开。

- 线上地址：<https://m.shit.pub>
- 托管：GitHub Pages（仓库根目录发布）

## 目录结构

```
.
├── CNAME                     # 自定义域名 m.shit.pub
├── .nojekyll                 # 关闭 Jekyll，保证 assets/ 等目录原样发布
├── index.html                # 唯一入口：国家选择 + 博物馆
├── robots.txt
├── sitemap.xml
├── tools/                    # 维护脚本，不参与页面运行
│   ├── validate-data.py
│   ├── check-links.py
│   ├── dedupe.py
│   └── smoke-test.js
└── assets/
    ├── icon.svg              # 2D 博物馆图标（自绘）
    ├── favicon.svg           # 标签页图标（自绘）
    ├── css/style.css
    └── js/
        ├── data-base.js      # 国家/地区列表、加密货币受限名单
        ├── data-01-culture.js   # 博物馆与文化遗产 / 阅读与文献 / 学习与教育 / 科学与研究
        ├── data-02-games.js     # 游戏 / 影视与动画 / 音乐与声音 / 图片与视觉
        ├── data-03-dev.js       # 编程与开发 / 人工智能 / 工具与效率 / 数据与开放数据
        ├── data-04-money.js     # 金融与经济 / 加密货币与区块链 / 新闻与信息 / 政府与公共资源
        ├── data-05-life.js      # 公益与社会 / 健康与生活 / 搜索与导航 / 冷门与趣味 / 航天与探索
        └── app.js
```

当前收录 **21 个展区、703 件展品**。

## 设计说明

- **纯静态**：原生 HTML/CSS/JS，无框架、无构建、无依赖、无外部请求，也不做任何埋点。
- **维基风格**：白底、蓝链（含 `:visited` 变紫）、衬线标题配灰色下划线、分类盒、
  提示框（ambox）、外链小箭头。没有圆角、阴影、渐变或深色模式。
- **简陋**：一套样式表，一个页面，所有数据都在 JS 文件里。
- **国家/地区选择**：首次进入必须选择所在地，结果存在浏览器 `localStorage`，也可用 `?c=CN` 直接指定。
- **加密货币展区**：
  - `CRYPTO_BLOCKED`（中国、阿富汗、阿尔及利亚、孟加拉国、玻利维亚、埃及、伊拉克、摩洛哥、尼泊尔、北马其顿、卡塔尔、突尼斯、瓦努阿图、伊朗、科威特、巴林、沙特、约旦、黎巴嫩、阿曼、巴基斯坦、叙利亚、也门）——整个展区不展示。
  - `CRYPTO_WARN`（土耳其、尼日利亚、印尼、印度、俄罗斯、越南）——照常展示，但顶部提示当地法规风险。
  - 名单在 `assets/js/data-base.js`，可自行增删。

## 新增一个展区

1. 在 `assets/js/data-0X-*.js` 里 `MUSEUM_CATEGORIES.push({...})`：

```js
MUSEUM_CATEGORIES.push({
  id: "heritage",              // 唯一 id
  name: "博物馆与文化遗产",
  note: "一句话说明这个展区收录什么",
  restricted: false,           // 可选：true 表示受地区限制
  sites: [
    // [中文名称, URL, 中文简介, 国家或地区, 语言, 标签数组]
    ["卢浮宫", "https://www.louvre.fr", "巴黎卢浮宫官网，可在线浏览约 48 万件馆藏。", "法国", "fr", ["艺术", "馆藏"]],
  ]
});
```

2. 如果是新文件，在 `index.html` 底部的 `<script>` 列表里加上它（放在 `app.js` 之前）。

## 本地预览

```sh
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 维护工具

三个脚本，都只用 Python 3 标准库，不需要装任何依赖。

```sh
python3 tools/validate-data.py    # 数据格式：括号配平、6 元组、链接、展区间去重
python3 tools/check-links.py      # 链接体检
python3 tools/check-links.py 02   # 只体检某个文件（这里只看 data-02-games.js）
python3 tools/dedupe.py --dry     # 跨展区去重（先看会删什么）
```

`dedupe.py` 顶部的 `RULES` 是「某个网址归哪个展区」的归属表，新增展区撞车时，
往表里加一行、跑一次即可。

冒烟测试用 macOS 自带的 JavaScriptCore 执行真实的 `app.js`（在仓库根目录运行）：

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc \
    tools/smoke-test.js
```

它会加载全部数据与脚本，检查展区数量、字段完整性、跨展区重复，
并模拟「入场选国家 → 加密货币展区按地区隐藏 / 显示」的完整流程。

## 部署

推到 GitHub 后，在仓库 **Settings → Pages** 里把 Source 设为 `Deploy from a branch`，
分支选 `main`、目录选 `/ (root)`。根目录的 `CNAME` 会让它绑定到 `m.shit.pub`。

DNS 侧需要配置：

```
m.shit.pub.  CNAME  <你的用户名>.github.io.
```

## 免责声明

本站只做收录与介绍，不构成任何投资建议。所有站点运行在各自域名下，内容与版权归原作者所有。
