// 数字博物馆 · 冒烟测试
//
// 本机没有 node 时，可以用 macOS 自带的 JavaScriptCore 跑
// （请在仓库根目录执行）：
//
//     /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc \
//         tools/smoke-test.js
//
// 它会加载全部数据文件与 app.js，用一套极简 DOM 桩把页面跑起来，
// 然后检查展区数量、加密货币地区限制、渲染结果是否正常。

var ROOT = '.';

var failures = [];
var checks = 0;

function ok(cond, label) {
  checks++;
  if (cond) {
    print('  ✓ ' + label);
  } else {
    failures.push(label);
    print('  ✗ ' + label);
  }
}

/* ---------------- 极简 DOM 桩 ---------------- */

function makeEl(id) {
  return {
    id: id,
    innerHTML: '',
    textContent: '',
    value: '',
    // index.html 里 <div id="app" hidden>，其余元素默认可见
    hidden: id === 'app',
    _listeners: {},
    classList: { toggle: function () {}, add: function () {}, remove: function () {} },
    addEventListener: function (type, fn) {
      (this._listeners[type] = this._listeners[type] || []).push(fn);
    },
    focus: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

// 派发一个点击：target 只需要能被 closest() 命中
function fire(el, type, selector, dataset) {
  var target = {
    closest: function (sel) {
      return sel === selector ? { dataset: dataset } : null;
    }
  };
  (el._listeners[type] || []).forEach(function (fn) { fn({ target: target }); });
}

var elements = {};
var store = {};

var window = this;
window.document = {
  readyState: 'complete',
  lastModified: '2026-10-04T00:00:00Z',
  getElementById: function (id) {
    if (!elements[id]) elements[id] = makeEl(id);
    return elements[id];
  },
  addEventListener: function () {}
};
window.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem: function (k, v) { store[k] = String(v); },
  removeItem: function (k) { delete store[k]; }
};
window.location = { href: 'https://m.shit.pub/', search: '' };
window.history = { replaceState: function () {} };
window.scrollTo = function () {};
window.open = function () {};
window.console = { log: function () {}, warn: function () {}, error: function () {} };
if (typeof URLSearchParams === 'undefined') {
  window.URLSearchParams = function (s) {
    this.get = function (k) {
      var m = new RegExp('[?&]' + k + '=([^&]*)').exec(s || '');
      return m ? m[1] : null;
    };
  };
}
if (typeof URL === 'undefined') {
  // 只实现 app.js 用到的部分：hostname 与 searchParams
  window.URL = function (s) {
    this.href = String(s);
    var m = /^[a-z]+:\/\/([^/?#]+)/i.exec(this.href);
    this.hostname = m ? m[1].replace(/:\d+$/, '') : '';
    this.searchParams = { set: function () {}, delete: function () {} };
  };
  window.URL.prototype.toString = function () { return this.href; };
}

/* ---------------- 加载数据 ---------------- */

print('加载数据文件…');
load(ROOT + '/assets/js/data-base.js');
['01-culture', '02-games', '03-dev', '04-money', '05-life'].forEach(function (n) {
  load(ROOT + '/assets/js/data-' + n + '.js');
});

var CATS = window.MUSEUM_CATEGORIES;
var total = 0;
CATS.forEach(function (c) { total += c.sites.length; });

print('\n[1] 数据结构');
ok(CATS.length === 21, '共 21 个展区（实际 ' + CATS.length + '）');
ok(total === 703, '共 703 件展品（实际 ' + total + '）');
ok(total >= 300, '展品数量达到「几百个」的量级');

var ids = {};
var keyProblems = [];
CATS.forEach(function (c) {
  if (ids[c.id]) keyProblems.push('展区 id 重复：' + c.id);
  ids[c.id] = true;
  if (!c.name || !c.note || !c.sites.length) keyProblems.push('展区字段缺失：' + c.id);
  var seen = {};
  c.sites.forEach(function (s) {
    if (s.length !== 6) keyProblems.push(c.id + ' 出现非 6 元组条目');
    if (String(s[1]).indexOf('https://') !== 0) keyProblems.push(c.id + ' 出现非 https 链接');
    if (seen[s[1]]) keyProblems.push(c.id + ' 内部重复：' + s[1]);
    seen[s[1]] = true;
  });
});
ok(keyProblems.length === 0, '字段 / 元组 / 链接 / 展区内唯一性' +
  (keyProblems.length ? '：' + keyProblems.slice(0, 3).join('；') : ''));

var allUrls = {};
var crossDupes = [];
CATS.forEach(function (c) {
  c.sites.forEach(function (s) {
    if (allUrls[s[1]]) crossDupes.push(s[1]);
    allUrls[s[1]] = true;
  });
});
ok(crossDupes.length === 0, '跨展区没有重复网址' +
  (crossDupes.length ? '：' + crossDupes.slice(0, 3).join('、') : ''));

var crypto = CATS.filter(function (c) { return c.id === 'crypto'; })[0];
ok(!!crypto, '存在加密货币展区');
ok(crypto && crypto.restricted === true, '加密货币展区标记了 restricted: true（受地区限制）');
ok(crypto && crypto.sites.length >= 20, '加密货币展品不少于 20 件');

var countries = window.MUSEUM_COUNTRIES_RAW || [];
ok(countries.length >= 190, '国家 / 地区列表不少于 190 项（实际 ' + countries.length + '）');
var cn = countries.filter(function (s) { return s.indexOf('CN:') === 0; })[0];
ok(cn === 'CN:中国', '列表里能找到中国');
ok((window.CRYPTO_BLOCKED || []).indexOf('CN') >= 0, '中国在加密货币受限名单里');

/* ---------------- 渲染冒烟 ---------------- */

function boot(country) {
  elements = {};
  store = {};
  if (country) store['museum.country.v1'] = country;
  load(ROOT + '/assets/js/app.js');
  return {
    cats: window.document.getElementById('cats').innerHTML,
    content: window.document.getElementById('content').innerHTML,
    count: window.document.getElementById('count').textContent,
    gate: window.document.getElementById('gate'),
    app: window.document.getElementById('app')
  };
}

print('\n[2] 未选国家：停在入场页');
var r = boot('');
ok(r.gate.hidden === false, '入场页显示');
ok(r.app.hidden === true, '博物馆主体隐藏');

print('\n[3] 未选国家时，入场页列出国家');
var gateList = window.document.getElementById('gateList').innerHTML;
ok(gateList.indexOf('中国') >= 0, '列表里有中国');
ok(gateList.indexOf('不作限定') >= 0, '列表里有「不作限定 / 全球」选项');
ok(gateList.indexOf('墨西哥') >= 0, '列表里有墨西哥');

print('\n[4] 选择中国（加密货币受限）：展区被隐藏');
r = boot('CN');
ok(r.app.hidden === false, '博物馆主体显示');
ok(r.cats.indexOf('加密货币') < 0, '展区导航里没有加密货币');
ok(r.content.indexOf('加密货币相关活动') >= 0, '给出了「按当地法规隐藏」的说明');
ok(r.content.indexOf('金融与经济') >= 0, '其他展区照常展示');

print('\n[5] 选择美国：加密货币展区出现');
r = boot('US');
ok(r.cats.indexOf('加密货币') >= 0, '展区导航里有加密货币');
ok(r.content.indexOf('Etherscan') >= 0, '加密货币展品已渲染');
ok(r.content.indexOf('<span class="host">louvre.fr</span>') >= 0,
  '域名从 URL 里正确解析（去掉 https:// 与 www.）');
ok(r.content.indexOf('<h2 class="sec">') >= 0, '展区标题用维基式的 h2.sec');
ok(r.content.indexOf('<ul class="entries">') >= 0, '条目用项目符号列表');
ok(r.content.indexOf('class="ext sitename"') >= 0, '外链带 ext 类（渲染外链箭头）');

print('\n[6] 选择土耳其（受限但不禁）：展区出现并附风险提示');
r = boot('TR');
ok(r.cats.indexOf('加密货币') >= 0, '展区导航里有加密货币');
ok(r.content.indexOf('不构成投资建议') >= 0, '显示了风险提示');

print('\n[7] 在入场页点「不作限定 / 全球」，进入博物馆');
r = boot('');
ok(r.app.hidden === true, '点击前停在入场页');
fire(window.document.getElementById('gateList'), 'click', 'button[data-code]', { code: '' });
ok(window.document.getElementById('app').hidden === false, '点击后进入博物馆');
ok(window.document.getElementById('gate').hidden === true, '入场页收起');
r = {
  cats: window.document.getElementById('cats').innerHTML,
  count: window.document.getElementById('count').textContent
};
ok(r.cats.indexOf('加密货币') >= 0, '全球模式下加密货币展区可见');
ok(r.count.indexOf('21 个展区') >= 0, '统计里写着 21 个展区');
ok(r.count.indexOf('地区：全球') >= 0, '地区显示为「全球」');

print('\n[8] 在入场页点「中国」，加密货币展区随即消失');
r = boot('');
fire(window.document.getElementById('gateList'), 'click', 'button[data-code]', { code: 'CN' });
r = { cats: window.document.getElementById('cats').innerHTML };
ok(r.cats.indexOf('加密货币') < 0, '加密货币展区被隐藏');
ok(store['museum.country.v1'] === 'CN', '选择被写进了 localStorage');
ok(window.document.getElementById('countryLabel').textContent === '中国', '顶栏显示「中国」');

/* ---------------- 汇总 ---------------- */

print('\n' + (failures.length ? '✗ ' + failures.length + ' 项未通过：' : '✓ 全部通过，共 ' + checks + ' 项检查'));
failures.forEach(function (f) { print('  · ' + f); });

if (failures.length) throw new Error('冒烟测试未通过');
