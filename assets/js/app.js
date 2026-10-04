(function () {
  'use strict';

  var REGION_KEY = 'museum.region.v1';
  var FAVS_KEY = 'museum.favs.v1';
  var PREVIEW = 12;

  var CATEGORIES = (window.MUSEUM_CATEGORIES || []).filter(function (category) {
    return category && category.sites && category.sites.length;
  });

  var REGIONS = (window.MUSEUM_COUNTRIES_RAW || []).map(function (entry) {
    var at = entry.indexOf(':');
    return { code: entry.slice(0, at), name: entry.slice(at + 1) };
  });

  var BLOCKED = new Set(window.CRYPTO_BLOCKED || []);
  var WARN = new Set(window.CRYPTO_WARN || []);

  var WEIGHT = { name: 100, tag: 24, host: 18, desc: 10, region: 5 };

  var state = {
    region: '',
    view: 'all',
    query: '',
    favs: new Set()
  };

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hostOf(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch (err) {
      return String(url).replace(/^https?:\/\//, '').split('/')[0];
    }
  }

  function read(key, fallback) {
    try {
      var value = localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (err) {}
  }

  function param(name) {
    try {
      return new URL(location.href).searchParams.get(name) || '';
    } catch (err) {
      return '';
    }
  }

  function regionName(code) {
    if (!code) return '全球';
    for (var i = 0; i < REGIONS.length; i++) {
      if (REGIONS[i].code === code) return REGIONS[i].name;
    }
    return code;
  }

  function cryptoTier() {
    if (!state.region) return 'ok';
    if (BLOCKED.has(state.region)) return 'blocked';
    if (WARN.has(state.region)) return 'warn';
    return 'ok';
  }

  function visibleCategories() {
    var tier = cryptoTier();
    return CATEGORIES.filter(function (category) {
      return !(category.restricted && tier === 'blocked');
    });
  }

  function flatten(categories) {
    var rows = [];
    categories.forEach(function (category) {
      category.sites.forEach(function (site) {
        rows.push({ category: category, site: site });
      });
    });
    return rows;
  }

  function cryptoMessage() {
    if (cryptoTier() === 'warn') {
      return '<p class="msg">你选择的地区（' + esc(regionName(state.region)) +
        '）对加密货币有额外限制或征税规定。以下站点为客观收录，<b>不构成投资建议</b>，请先确认当地法律。</p>';
    }
    return '<p class="msg">你选择的地区（' + esc(regionName(state.region)) +
      '）禁止或严格限制加密货币相关活动，该展区已隐藏。</p>';
  }

  function termsOf(query) {
    return query.toLowerCase().split(/\s+/).filter(function (word) {
      return word.length > 0;
    });
  }

  function scoreOf(site, words) {
    var name = String(site[0]).toLowerCase();
    var url = String(site[1]).toLowerCase();
    var desc = String(site[2]).toLowerCase();
    var region = String(site[3]).toLowerCase();
    var tags = (site[5] || []).join(' ').toLowerCase();
    var score = 0;

    for (var i = 0; i < words.length; i++) {
      var word = words[i];
      var hit = 0;
      if (name === word) hit = WEIGHT.name * 4;
      else if (name.indexOf(word) === 0) hit = WEIGHT.name * 2;
      else if (name.indexOf(word) >= 0) hit = WEIGHT.name;
      else if (tags.indexOf(word) >= 0) hit = WEIGHT.tag;
      else if (url.indexOf(word) >= 0) hit = WEIGHT.host;
      else if (desc.indexOf(word) >= 0) hit = WEIGHT.desc;
      else if (region.indexOf(word) >= 0) hit = WEIGHT.region;
      if (hit === 0) return 0;
      score += hit;
    }
    return score;
  }

  function escapeRe(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function mark(text, words) {
    var source = String(text);
    if (!words.length) return esc(source);
    var pattern = words.slice().sort(function (a, b) {
      return b.length - a.length;
    }).map(escapeRe).join('|');
    if (!pattern) return esc(source);
    return source.split(new RegExp('(' + pattern + ')', 'gi')).map(function (part, index) {
      return index % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part);
    }).join('');
  }

  function headHtml(title, count, note, moreFor) {
    var right = moreFor
      ? '<a class="more" href="?view=' + esc(moreFor) + '" data-cat="' + esc(moreFor) + '">全部 ' +
        count + ' 条 →</a>'
      : '<span class="tally">' + count + ' 条</span>';
    return '<div class="head"><h2>' + title + '</h2>' + right + '</div>' +
      (note ? '<p class="note">' + note + '</p>' : '');
  }

  function itemHtml(row, words, showCategory) {
    var category = row.category;
    var site = row.site;
    var url = site[1];
    var starred = state.favs.has(url);
    var tags = (site[5] || []).map(function (tag) {
      return '<span class="t">' + esc(tag) + '</span>';
    }).join('');

    return '<li>' +
      '<a class="ext name" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' +
        mark(site[0], words) + '</a>' +
      '<span class="host">' + esc(hostOf(url)) + '</span>' +
      '<button class="star' + (starred ? ' on' : '') + '" type="button" data-fav="' + esc(url) +
        '" title="收藏 / 取消收藏" aria-label="收藏">' + (starred ? '★' : '☆') + '</button>' +
      '<div class="desc">' + mark(site[2], words) + '</div>' +
      '<div class="meta">' +
        (showCategory ? esc(category.name) + ' · ' : '') +
        esc(site[3]) + ' · ' + esc(site[4]) +
        (tags ? ' · ' + tags : '') +
      '</div>' +
    '</li>';
  }

  function listHtml(rows, words, showCategory) {
    return '<ul class="list">' + rows.map(function (row) {
      return itemHtml(row, words, showCategory);
    }).join('') + '</ul>';
  }

  function rowsOf(category) {
    return category.sites.map(function (site) {
      return { category: category, site: site };
    });
  }

  function renderRing() {
    var categories = visibleCategories();
    var total = flatten(categories).length;
    var radius = 42;
    var html = '<div class="core"><img src="assets/icon.svg" alt="" width="26" height="26">' +
      '<b>数字博物馆</b><span>' + total + ' 条</span></div>';

    html += categories.map(function (category, index) {
      var angle = (index / categories.length) * Math.PI * 2 - Math.PI / 2;
      var x = (50 + radius * Math.cos(angle)).toFixed(2);
      var y = (50 + radius * Math.sin(angle)).toFixed(2);
      var active = state.view === category.id ? ' on' : '';
      return '<button class="node' + active + '" type="button" data-view="' + esc(category.id) +
        '" style="left:' + x + '%;top:' + y + '%" title="' +
        esc(category.name + '（' + category.sites.length + ' 条）') + '">' +
        '<span class="dot"></span>' + esc(category.short || category.name) + '</button>';
    }).join('');

    $('ring').innerHTML = html;
  }

  function render() {
    var categories = visibleCategories();
    var rows = flatten(categories);
    var query = state.query.trim();
    var words = query ? termsOf(query) : [];
    var html = '';
    var shown = 0;

    if (query) {
      var hits = rows.map(function (row) {
        return { row: row, score: scoreOf(row.site, words) };
      }).filter(function (hit) {
        return hit.score > 0;
      }).sort(function (a, b) {
        return b.score - a.score;
      }).map(function (hit) {
        return hit.row;
      });

      html += headHtml('搜索“' + esc(query) + '”', hits.length);
      html += hits.length
        ? listHtml(hits, words, true)
        : '<p class="empty">没有找到。换个更短的关键词试试，比如「地图」「开源」「爵士」。</p>';
      shown = hits.length;

    } else if (state.view === 'fav') {
      var favs = rows.filter(function (row) {
        return state.favs.has(row.site[1]);
      });
      html += headHtml('我的收藏', favs.length);
      html += favs.length
        ? listHtml(favs, [], true)
        : '<p class="empty">还没有收藏。点条目右侧的 ☆ 就把展品收进来，存在你自己的浏览器里。</p>';
      shown = favs.length;

    } else if (state.view === 'all') {
      if (cryptoTier() === 'blocked') html += cryptoMessage();
      categories.forEach(function (category) {
        html += headHtml(esc(category.name), category.sites.length,
          esc(category.note || ''), category.id);
        if (category.restricted) html += cryptoMessage();
        html += listHtml(rowsOf(category).slice(0, PREVIEW), [], false);
        shown += Math.min(PREVIEW, category.sites.length);
      });

    } else {
      var picked = null;
      categories.forEach(function (category) {
        if (category.id === state.view) picked = category;
      });
      if (!picked) {
        state.view = 'all';
        renderRing();
        return render();
      }
      html += headHtml(esc(picked.name), picked.sites.length, esc(picked.note || ''));
      if (picked.restricted) html += cryptoMessage();
      html += listHtml(rowsOf(picked), [], false);
      shown = picked.sites.length;
    }

    $('listing').innerHTML = html;
    $('favCount').textContent = state.favs.size;
    $('ringWrap').hidden = !!query || state.view === 'fav';
    $('footStamp').textContent = '共 ' + rows.length + ' 条 · ' + categories.length +
      ' 个展区 · 地区：' + regionName(state.region) +
      (shown === rows.length ? '' : ' · 本页显示 ' + shown + ' 条');
  }

  function syncUrl() {
    try {
      var url = new URL(location.href);
      if (state.region) url.searchParams.set('c', state.region);
      else url.searchParams.delete('c');
      if (state.view === 'all' || state.view === 'fav') url.searchParams.delete('view');
      else url.searchParams.set('view', state.view);
      if (state.query) url.searchParams.set('q', state.query);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url.toString());
    } catch (err) {}
  }

  function update() {
    renderRing();
    render();
    syncUrl();
  }

  function renderGate(filter) {
    var needle = (filter || '').trim().toLowerCase();
    var matches = REGIONS.filter(function (region) {
      return !needle ||
        region.name.toLowerCase().indexOf(needle) >= 0 ||
        region.code.toLowerCase().indexOf(needle) >= 0;
    });

    var html = '';
    if (!needle) {
      html += '<li><button data-code="" type="button">' +
        '<span>🌍 不作限定 / 我在全球</span><span class="code">GLOBAL</span></button></li>';
    }
    if (!matches.length && needle) {
      html += '<li><span class="code" style="padding:8px 9px;display:block">没有找到匹配的国家或地区。</span></li>';
    }
    matches.forEach(function (region) {
      html += '<li><button data-code="' + esc(region.code) + '" type="button">' +
        '<span>' + esc(region.name) + '</span><span class="code">' + esc(region.code) +
        '</span></button></li>';
    });
    $('gateList').innerHTML = html;
  }

  function chooseRegion(code) {
    state.region = code || '';
    write(REGION_KEY, state.region);
    enterApp();
  }

  function enterApp() {
    $('gate').hidden = true;
    $('app').hidden = false;
    $('regionLabel').textContent = regionName(state.region);
    update();
    $('search').focus();
  }

  function openGate() {
    $('gate').hidden = false;
    $('app').hidden = true;
    $('gateSearch').value = '';
    renderGate('');
    $('gateSearch').focus();
  }

  function setView(view) {
    state.view = view;
    state.query = '';
    $('search').value = '';
    update();
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  function bind() {
    $('gateSearch').addEventListener('input', function (event) {
      renderGate(event.target.value);
    });

    $('gateSearch').addEventListener('keydown', function (event) {
      if (event.key !== 'Enter') return;
      var first = $('gateList').querySelector('button[data-code]');
      if (first) chooseRegion(first.dataset.code);
    });

    $('gateList').addEventListener('click', function (event) {
      var button = event.target.closest('button[data-code]');
      if (button) chooseRegion(button.dataset.code);
    });

    $('ring').addEventListener('click', function (event) {
      var button = event.target.closest('button[data-view]');
      if (button) setView(button.dataset.view);
    });

    $('search').addEventListener('input', function (event) {
      state.query = event.target.value;
      render();
      syncUrl();
    });

    $('search').addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.target.value = '';
        state.query = '';
        update();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== '/' || $('app').hidden) return;
      var tag = (event.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      event.preventDefault();
      $('search').focus();
    });

    $('listing').addEventListener('click', function (event) {
      var star = event.target.closest('button[data-fav]');
      if (star) {
        var url = star.dataset.fav;
        if (state.favs.has(url)) state.favs.delete(url);
        else state.favs.add(url);
        write(FAVS_KEY, JSON.stringify(Array.from(state.favs)));
        star.classList.toggle('on');
        star.textContent = state.favs.has(url) ? '★' : '☆';
        $('favCount').textContent = state.favs.size;
        if (state.view === 'fav') render();
        return;
      }
      var more = event.target.closest('a[data-cat]');
      if (more) {
        event.preventDefault();
        setView(more.dataset.cat);
      }
    });

    $('btnFav').addEventListener('click', function () {
      setView('fav');
    });

    $('btnRandom').addEventListener('click', function () {
      var pool = flatten(visibleCategories());
      if (!pool.length) return;
      var pick = pool[Math.floor(Math.random() * pool.length)];
      window.open(pick.site[1], '_blank', 'noopener');
    });

    $('btnRegion').addEventListener('click', openGate);

    $('btnReset').addEventListener('click', function () {
      state.region = '';
      write(REGION_KEY, '');
      openGate();
    });
  }

  function loadFavs() {
    try {
      return new Set(JSON.parse(read(FAVS_KEY, '[]')));
    } catch (err) {
      return new Set();
    }
  }

  function boot() {
    if (!CATEGORIES.length) {
      $('gateList').innerHTML = '<li><span class="code">数据文件未能加载，请刷新页面。</span></li>';
      return;
    }

    state.favs = loadFavs();
    state.region = param('c') || read(REGION_KEY, '');
    state.query = param('q');

    var view = param('view');
    if (view && CATEGORIES.some(function (category) { return category.id === view; })) {
      state.view = view;
    }

    renderGate('');
    bind();

    if (state.region) enterApp();
    else {
      $('app').hidden = true;
      $('gate').hidden = false;
      $('gateSearch').focus();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
