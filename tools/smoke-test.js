var ROOT = '.';

var failures = [];
var checks = 0;

function ok(cond, label) {
  checks++;
  if (cond) print('  ok   ' + label);
  else {
    failures.push(label);
    print('  FAIL ' + label);
  }
}

function makeEl(id) {
  return {
    id: id,
    innerHTML: '',
    textContent: '',
    value: '',
    hidden: id === 'app',
    tagName: 'DIV',
    _listeners: {},
    classList: {
      toggle: function () {},
      add: function () {},
      remove: function () {},
      contains: function () { return false; }
    },
    addEventListener: function (type, fn) {
      (this._listeners[type] = this._listeners[type] || []).push(fn);
    },
    focus: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; }
  };
}

function fire(el, type, target) {
  (el._listeners[type] || []).forEach(function (fn) { fn({ target: target }); });
}

function picker(selector, dataset) {
  return {
    dataset: dataset,
    closest: function (sel) { return sel === selector ? this : null; },
    classList: { toggle: function () {}, add: function () {}, remove: function () {} },
    textContent: ''
  };
}

var elements = {};
var store = {};
var href = 'https://m.shit.pub/';

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
window.location = { href: href, search: '' };
window.history = { replaceState: function () {} };
window.scrollTo = function () {};
window.open = function () {};
window.console = { log: function () {}, warn: function () {}, error: function () {} };

if (typeof URL === 'undefined' || !new URL('https://a.b/?x=1').searchParams) {
  window.URL = function (s) {
    this.href = String(s);
    var host = /^[a-z]+:\/\/([^/?#]+)/i.exec(this.href);
    this.hostname = host ? host[1].replace(/:\d+$/, '') : '';
    var query = this.href.indexOf('?') >= 0 ? this.href.slice(this.href.indexOf('?') + 1) : '';
    this.searchParams = {
      get: function (name) {
        var m = new RegExp('[?&]' + name + '=([^&]*)').exec('?' + query);
        return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
      },
      set: function () {},
      delete: function () {}
    };
  };
  window.URL.prototype.toString = function () { return this.href; };
}

print('loading data files...');
load(ROOT + '/assets/js/data-base.js');
['01-culture', '02-games', '03-dev', '04-money', '05-life'].forEach(function (n) {
  load(ROOT + '/assets/js/data-' + n + '.js');
});

var CATS = window.MUSEUM_CATEGORIES;
var TOTAL = CATS.reduce(function (n, c) { return n + c.sites.length; }, 0);

print('\n[1] data');
ok(CATS.length === 21, '21 categories, got ' + CATS.length);
ok(TOTAL === 703, '703 sites, got ' + TOTAL);
ok(TOTAL >= 300, 'site count is in the hundreds');

var seenIds = {};
var seenUrls = {};
var problems = [];
CATS.forEach(function (c) {
  if (seenIds[c.id]) problems.push('duplicate category id ' + c.id);
  seenIds[c.id] = true;
  if (!c.name || !c.note || !c.sites.length) problems.push('missing field in ' + c.id);
  if (!c.short || c.short.length > 3) problems.push('bad short name in ' + c.id + ': ' + c.short);
  c.sites.forEach(function (s) {
    if (s.length !== 6) problems.push('non 6-tuple in ' + c.id);
    if (String(s[1]).indexOf('https://') !== 0) problems.push('non https url in ' + c.id);
    if (seenUrls[s[1]]) problems.push('duplicate url ' + s[1]);
    seenUrls[s[1]] = true;
  });
});
ok(problems.length === 0, 'fields, tuples, urls all sane' +
  (problems.length ? ': ' + problems.slice(0, 3).join('; ') : ''));

var crypto = CATS.filter(function (c) { return c.id === 'crypto'; })[0];
ok(!!crypto && crypto.restricted === true, 'crypto category flagged restricted');
ok(!!crypto && crypto.sites.length >= 20, 'crypto has at least 20 entries');

var regions = window.MUSEUM_COUNTRIES_RAW || [];
ok(regions.length >= 190, 'at least 190 regions, got ' + regions.length);
ok((window.CRYPTO_BLOCKED || []).indexOf('CN') >= 0, 'China is on the blocked list');

function boot(region, url) {
  elements = {};
  store = {};
  href = url || 'https://m.shit.pub/';
  window.location = { href: href, search: '' };
  if (region) store['museum.region.v1'] = region;
  load(ROOT + '/assets/js/app.js');
  return {
    ring: window.document.getElementById('ring').innerHTML,
    listing: window.document.getElementById('listing').innerHTML,
    stamp: window.document.getElementById('footStamp').textContent,
    region: window.document.getElementById('regionLabel').textContent,
    gate: window.document.getElementById('gate').hidden,
    app: window.document.getElementById('app').hidden,
    ringHidden: window.document.getElementById('ringWrap').hidden,
    gateList: window.document.getElementById('gateList').innerHTML
  };
}

print('\n[2] region gate');
var r = boot('');
ok(r.gate === false, 'gate is visible');
ok(r.app === true, 'museum is hidden');
ok(r.gateList.indexOf('中国') >= 0, 'region list contains China');
ok(r.gateList.indexOf('不作限定') >= 0, 'region list offers a global option');

print('\n[3] China: crypto展区 hidden');
r = boot('CN');
ok(r.app === false, 'museum is visible');
ok(r.ring.indexOf('加密') < 0, 'ring has no crypto node');
ok(r.listing.indexOf('加密货币相关活动') >= 0, 'listing explains the local restriction');
ok(r.listing.indexOf('金融') >= 0, 'other categories still render');

print('\n[4] United States: crypto visible');
r = boot('US');
ok(r.ring.indexOf('加密') >= 0, 'ring has the crypto node');
ok(r.listing.indexOf('Etherscan') >= 0, 'crypto entries render');
ok(r.listing.indexOf('<span class="host">louvre.fr</span>') >= 0, 'host is parsed from the url');
ok(r.listing.indexOf('<mark>') < 0, 'no highlight without a query');

print('\n[5] Turkey: warning shown');
r = boot('TR');
ok(r.ring.indexOf('加密') >= 0, 'crypto node still present');
ok(r.listing.indexOf('不构成投资建议') >= 0, 'risk warning shown');

print('\n[6] ring geometry');
r = boot('US');
ok(r.ring.indexOf('<div class="core">') >= 0, 'center hub rendered');
ok(r.ring.indexOf('数字博物馆') >= 0, 'center hub is labelled');
var nodes = r.ring.match(/class="node/g) || [];
ok(nodes.length === 21, '21 nodes around the ring, got ' + nodes.length);
var placed = r.ring.match(/style="left:[\d.]+%;top:[\d.]+%"/g) || [];
ok(placed.length === 21, 'every node has computed coordinates, got ' + placed.length);
ok(r.ring.indexOf('title="博物馆与文化遗产（39 条）"') >= 0, 'node tooltip carries the full name');

function nodePoints() {
  var out = [];
  var re = /style="left:([\d.]+)%;top:([\d.]+)%"/g;
  var m;
  while ((m = re.exec(r0.ring)) !== null) {
    out.push({ x: parseFloat(m[1]), y: parseFloat(m[2]) });
  }
  return out;
}

function minGap(size) {
  var pts = nodePoints();
  var best = Infinity;
  for (var i = 0; i < pts.length; i++) {
    var j = (i + 1) % pts.length;
    var dx = (pts[i].x - pts[j].x) / 100 * size;
    var dy = (pts[i].y - pts[j].y) / 100 * size;
    best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
  }
  return best;
}

print('\n[6b] ring fits without overlapping labels');
var r0 = r;
var maxShort = CATS.reduce(function (n, c) {
  return Math.max(n, (c.short || c.name).length);
}, 0);
var gapDesktop = minGap(500);
var labelDesktop = maxShort * 13 + 10 + 14;
ok(gapDesktop > labelDesktop,
   'desktop 500px: gap ' + gapDesktop.toFixed(1) + 'px > label ' + labelDesktop + 'px');
var gapPhone = minGap(353);
var labelPhone = maxShort * 11 + 8;
ok(gapPhone > labelPhone,
   'phone 353px: gap ' + gapPhone.toFixed(1) + 'px > label ' + labelPhone + 'px');
var radiusPx = 0.42 * 500;
var corePx = 0.17 * 500;
ok(radiusPx - labelDesktop / 2 > corePx,
   'nodes clear the center hub: inner edge ' + (radiusPx - labelDesktop / 2).toFixed(0) +
   'px > hub radius ' + corePx.toFixed(0) + 'px');

function type(value) {
  var field = window.document.getElementById('search');
  field.value = value;
  fire(field, 'input', { value: value });
  return window.document.getElementById('listing').innerHTML;
}

print('\n[7] search');
r = boot('US');
var out = type('卢浮宫');
ok(out.indexOf('louvre.fr') >= 0, 'finds the Louvre by its Chinese name');
ok(out.indexOf('<mark>卢浮宫</mark>') >= 0, 'highlights the matched text');
var firstItem = out.slice(out.indexOf('<li>'));
firstItem = firstItem.slice(0, firstItem.indexOf('</li>'));
ok(firstItem.indexOf('louvre.fr') >= 0, 'name match ranks to the top');

out = type('开源 音乐');
ok(out.indexOf('class="head"') >= 0, 'multi-keyword query returns results');
ok(out.indexOf('条</span>') >= 0, 'result count is shown');

out = type('zzzzqqqq');
ok(out.indexOf('没有找到') >= 0, 'unknown query shows an empty state');

out = type('地图');
ok(out.indexOf('<mark>地图</mark>') >= 0, 'matches inside descriptions too');

print('\n[8] deep links');
r = boot('US', 'https://m.shit.pub/?view=games');
ok(r.listing.indexOf('Steam') >= 0 || r.listing.indexOf('itch.io') >= 0, '?view=games renders the games section');
ok(r.listing.indexOf('博物馆与文化遗产') < 0, 'other categories are not rendered');
ok((r.listing.match(/class="head"/g) || []).length === 1, 'exactly one section heading');

r = boot('', 'https://m.shit.pub/?c=CN&view=finance');
ok(r.app === false, '?c=CN enters the museum directly');
ok(r.region === '中国', 'region label follows the url');
ok(r.listing.indexOf('加密货币') < 0, 'crypto stays hidden for China');

r = boot('US', 'https://m.shit.pub/?q=%E5%BC%80%E6%BA%90');
ok(r.listing.indexOf('<mark>开源</mark>') >= 0, '?q= runs a search on load');
ok(r.ringHidden === true, 'ring is hidden while searching');
ok(r.stamp.indexOf('本页显示') >= 0, 'footer reports the visible count');

print('\n[9] favourites');
r = boot('US');
var star = picker('button[data-fav]', { fav: 'https://www.louvre.fr' });
fire(window.document.getElementById('listing'), 'click', star);
ok(store['museum.favs.v1'].indexOf('louvre.fr') >= 0, 'starred url is persisted');
ok(window.document.getElementById('favCount').textContent === 1, 'counter updated');
var star2 = picker('button[data-fav]', { fav: 'https://www.louvre.fr' });
fire(window.document.getElementById('listing'), 'click', star2);
ok(JSON.parse(store['museum.favs.v1']).length === 0, 'clicking again removes it');

print('\n' + (failures.length
  ? 'FAILED ' + failures.length + ' of ' + checks
  : 'all ' + checks + ' checks passed'));
failures.forEach(function (f) { print('  - ' + f); });

if (failures.length) throw new Error('smoke test failed');
