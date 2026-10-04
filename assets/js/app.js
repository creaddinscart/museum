/* 数字博物馆 · m.shit.pub
   纯原生 JS，无依赖，无跟踪，无网络请求。 */

(function () {
  'use strict';

  var LS_COUNTRY = 'museum.country.v1';
  var LS_FAV = 'museum.favs.v1';

  var ALL_CATS = (window.MUSEUM_CATEGORIES || []).filter(function (c) {
    return c && c.sites && c.sites.length;
  });

  var COUNTRIES = (window.MUSEUM_COUNTRIES_RAW || []).map(function (s) {
    var i = s.indexOf(':');
    return { code: s.slice(0, i), name: s.slice(i + 1) };
  });

  var BLOCKED = new Set(window.CRYPTO_BLOCKED || []);
  var WARN = new Set(window.CRYPTO_WARN || []);

  var state = {
    country: '',
    view: 'all',      // 'all' | 'fav' | 展区 id
    query: '',
    favs: new Set()
  };

  /* ---------- 存储 ---------- */

  function loadCountry() {
    var q = new URLSearchParams(location.search).get('c');
    if (q && /^[A-Z]{2}$/.test(q)) return q;
    try { return localStorage.getItem(LS_COUNTRY) || ''; } catch (e) { return ''; }
  }

  function saveCountry(code) {
    try { localStorage.setItem(LS_COUNTRY, code); } catch (e) {}
    try {
      var u = new URL(location.href);
      if (code) u.searchParams.set('c', code); else u.searchParams.delete('c');
      history.replaceState(null, '', u.toString());
    } catch (e) { /* file:// 下可能不允许改写地址 */ }
  }

  function loadFavs() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_FAV) || '[]')); }
    catch (e) { return new Set(); }
  }

  function saveFavs() {
    try { localStorage.setItem(LS_FAV, JSON.stringify(Array.from(state.favs))); } catch (e) {}
  }

  /* ---------- 加密货币地区限制 ---------- */

  function cryptoTier() {
    if (!state.country) return 'ok';
    if (BLOCKED.has(state.country)) return 'blocked';
    if (WARN.has(state.country)) return 'warn';
    return 'ok';
  }

  function visibleCats() {
    var tier = cryptoTier();
    return ALL_CATS.filter(function (c) {
      return !(c.restricted && tier === 'blocked');
    });
  }

  function countryName(code) {
    if (!code) return '全球';
    var hit = COUNTRIES.filter(function (c) { return c.code === code; })[0];
    return hit ? hit.name : code;
  }

  /* ---------- 小工具 ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); }
    catch (e) { return url; }
  }

  function $(id) { return document.getElementById(id); }

  function allSites(cats) {
    var out = [];
    cats.forEach(function (c) {
      c.sites.forEach(function (s, i) { out.push({ cat: c, site: s, key: c.id + ':' + i }); });
    });
    return out;
  }

  function matches(site, q) {
    if (!q) return true;
    var hay = [site[0], site[1], site[2], site[3], site[4], (site[5] || []).join(' ')]
      .join(' ').toLowerCase();
    return q.toLowerCase().split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }

  /* ---------- 入场 ---------- */

  function renderGate(filter) {
    var list = $('gateList');
    var q = (filter || '').trim().toLowerCase();
    var rows = COUNTRIES.filter(function (c) {
      return !q || c.name.toLowerCase().indexOf(q) >= 0 || c.code.toLowerCase().indexOf(q) >= 0;
    });

    var html = '';
    if (!q) {
      html += '<li><button data-code="" type="button">' +
        '<span>🌍 不作限定 / 我在全球</span><span class="code">GLOBAL</span></button></li>';
    }
    if (!rows.length && q) {
      html += '<li class="empty">没有找到匹配的国家或地区，换个关键词试试。</li>';
    }
    rows.forEach(function (c) {
      html += '<li><button data-code="' + esc(c.code) + '" type="button">' +
        '<span>' + esc(c.name) + '</span><span class="code">' + esc(c.code) + '</span></button></li>';
    });
    list.innerHTML = html;
  }

  function pickCountry(code) {
    state.country = code || '';
    saveCountry(state.country);
    enterApp();
  }

  /* ---------- 博物馆 ---------- */

  function enterApp() {
    $('gate').hidden = true;
    $('app').hidden = false;
    $('countryLabel').textContent = countryName(state.country);
    renderTabs();
    renderCats();
    render();
  }

  function renderTabs() {
    $('btnAll').classList.toggle('on', state.view !== 'fav');
    $('btnFav').classList.toggle('on', state.view === 'fav');
  }

  function renderCats() {
    var cats = visibleCats();
    var sep = '<span class="sep"> · </span>';
    var items = ['<button type="button" data-view="all"' +
      (state.view === 'all' ? ' class="on"' : '') + '>全部</button>'];

    cats.forEach(function (c) {
      items.push('<button type="button" data-view="' + esc(c.id) + '"' +
        (state.view === c.id ? ' class="on"' : '') + '>' +
        esc(c.name) + '（' + c.sites.length + '）</button>');
    });

    $('cats').innerHTML = '<span class="label">展区：</span>' + items.join(sep);
  }

  function siteHtml(entry, showCat) {
    var c = entry.cat, s = entry.site;
    var on = state.favs.has(s[1]);
    var tags = (s[5] || []).map(function (t) {
      return '<span class="t">' + esc(t) + '</span>';
    }).join('');

    return '<li>' +
      '<a class="ext sitename" href="' + esc(s[1]) + '" target="_blank" rel="noopener noreferrer">' +
        esc(s[0]) + '</a>' +
      '<span class="host">' + esc(hostOf(s[1])) + '</span>' +
      '<button class="star' + (on ? ' on' : '') + '" type="button" data-fav="' + esc(s[1]) +
        '" title="收藏 / 取消收藏" aria-label="收藏">' + (on ? '★' : '☆') + '</button>' +
      '<div class="desc">' + esc(s[2]) + '</div>' +
      '<div class="meta">' +
        (showCat ? esc(c.name) + ' · ' : '') +
        esc(s[3]) + ' · ' + esc(s[4]) +
        (tags ? ' · ' + tags : '') +
      '</div>' +
    '</li>';
  }

  function catHeader(cat, extra) {
    return '<h2 class="sec">' + esc(cat.name) +
      '<span class="n">' + cat.sites.length + ' 条</span></h2>' +
      (cat.note ? '<p class="sec-note">' + esc(cat.note) + '</p>' : '') +
      (extra || '');
  }

  function cryptoNotice() {
    var tier = cryptoTier();
    if (tier === 'warn') {
      return '<div class="ambox">你选择的地区（' + esc(countryName(state.country)) +
        '）对加密货币有额外限制或征税规定。以下站点为客观收录，<b>不构成投资建议</b>，请先确认当地法律。</div>';
    }
    if (tier === 'blocked') {
      return '<div class="ambox">你选择的地区（' + esc(countryName(state.country)) +
        '）禁止或严格限制加密货币相关活动，该展区已隐藏。</div>';
    }
    return '';
  }

  function render() {
    var cats = visibleCats();
    var q = state.query.trim();
    var html = '';
    var shown = 0;

    function listing(sites, cat, showCat) {
      return '<ul class="entries">' + sites.map(function (s) {
        return siteHtml({ cat: cat, site: s }, showCat);
      }).join('') + '</ul>';
    }

    if (state.view === 'fav') {
      var favs = allSites(cats)
        .filter(function (e) { return state.favs.has(e.site[1]); })
        .filter(function (e) { return matches(e.site, q); });
      html += '<h2 class="sec">我的收藏<span class="n">' + favs.length + ' 条</span></h2>';
      html += favs.length
        ? '<ul class="entries">' + favs.map(function (e) { return siteHtml(e, true); }).join('') + '</ul>'
        : '<p class="empty">还没有收藏。点条目右侧的 ☆ 就能把展品收进这里（存在你自己的浏览器里）。</p>';
      shown = favs.length;

    } else if (q) {
      var hits = allSites(cats).filter(function (e) { return matches(e.site, q); });
      html += '<h2 class="sec">搜索“' + esc(q) + '”<span class="n">' + hits.length + ' 条</span></h2>';
      html += hits.length
        ? '<ul class="entries">' + hits.map(function (e) { return siteHtml(e, true); }).join('') + '</ul>'
        : '<p class="empty">没有找到。试试更短的关键词，例如「地图」「开源」「爵士」。</p>';
      shown = hits.length;

    } else if (state.view === 'all') {
      if (cryptoTier() === 'blocked') html += cryptoNotice();
      cats.forEach(function (c) {
        html += catHeader(c, c.restricted ? cryptoNotice() : '');
        html += listing(c.sites, c, false);
        shown += c.sites.length;
      });

    } else {
      var cat = cats.filter(function (c) { return c.id === state.view; })[0];
      if (!cat) { state.view = 'all'; renderCats(); renderTabs(); return render(); }
      html += catHeader(cat, cat.restricted ? cryptoNotice() : '');
      html += listing(cat.sites, cat, false);
      shown = cat.sites.length;
    }

    $('content').innerHTML = html;

    var label = state.view === 'fav' ? '我的收藏'
      : state.view === 'all' ? '全部展区'
      : (cats.filter(function (c) { return c.id === state.view; })[0] || {}).name || '';
    $('count').textContent = '本页显示 ' + shown + ' 条 · 共收录 ' +
      allSites(cats).length + ' 条 · ' + cats.length + ' 个展区' +
      (label ? ' · ' + label : '') + ' · 地区：' + countryName(state.country);
    $('favCount').textContent = state.favs.size;

    if (cryptoTier() === 'blocked' && !$('content').querySelector('.ambox')) {
      $('count').textContent += ' · 加密货币展区已按当地法规隐藏';
    }
  }

  /* ---------- 事件 ---------- */

  function bind() {
    $('gateSearch').addEventListener('input', function (e) { renderGate(e.target.value); });
    $('gateList').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-code]');
      if (b) pickCountry(b.dataset.code);
    });
    $('gateSearch').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = $('gateList').querySelector('button[data-code]');
        if (first) pickCountry(first.dataset.code);
      }
    });

    $('cats').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]');
      if (!b) return;
      state.view = b.dataset.view;
      state.query = '';
      $('search').value = '';
      renderTabs();
      renderCats();
      render();
      scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('search').addEventListener('input', function (e) {
      state.query = e.target.value;
      render();
    });

    $('content').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-fav]');
      if (!b) return;
      var url = b.dataset.fav;
      if (state.favs.has(url)) state.favs.delete(url); else state.favs.add(url);
      saveFavs();
      b.classList.toggle('on');
      b.textContent = state.favs.has(url) ? '★' : '☆';
      $('favCount').textContent = state.favs.size;
      if (state.view === 'fav') render();
    });

    $('btnAll').addEventListener('click', function () {
      state.view = 'all';
      state.query = '';
      $('search').value = '';
      renderTabs();
      renderCats();
      render();
    });

    $('btnFav').addEventListener('click', function () {
      state.view = 'fav';
      state.query = '';
      $('search').value = '';
      renderTabs();
      renderCats();
      render();
      scrollTo({ top: 0, behavior: 'smooth' });
    });

    $('btnRandom').addEventListener('click', function () {
      var pool = allSites(visibleCats()).filter(function (e) { return matches(e.site, state.query); });
      if (!pool.length) return;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      window.open(pick.site[1], '_blank', 'noopener');
    });

    $('btnCountry').addEventListener('click', function () {
      $('gate').hidden = false;
      $('app').hidden = true;
      $('gateSearch').value = '';
      renderGate('');
      $('gateSearch').focus();
    });

    $('btnReset').addEventListener('click', function () {
      state.country = '';
      saveCountry('');
      $('btnCountry').click();
    });
  }

  /* ---------- 启动 ---------- */

  function boot() {
    state.favs = loadFavs();
    state.country = loadCountry();
    renderGate('');

    if (!ALL_CATS.length) {
      $('gateList').innerHTML = '<li class="empty">数据文件未能加载，请刷新页面。</li>';
      return;
    }
    bind();

    if (state.country) {
      enterApp();
    } else {
      $('gateSearch').focus();
    }

    var d = new Date(document.lastModified || Date.now());
    $('footStamp').textContent = '本页更新于 ' + d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') +
      ' · 共 ' + ALL_CATS.reduce(function (n, c) { return n + c.sites.length; }, 0) + ' 件展品';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
