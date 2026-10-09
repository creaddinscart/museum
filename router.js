/* router.js - turns the front page into a query driven view.
   m.shit.pub/?countries        the country index
   m.shit.pub/?country=france   one country
   m.shit.pub/?room=design      one room
   m.shit.pub/?=finance         search: the part after = is the term
   m.shit.pub/?q=finance        the same search, written the usual way

   Static .html files are kept and stay the canonical addresses, so the site
   still works with scripting off and still gets indexed. This file only adds
   the short form on top. */

(function () {
  'use strict';

  var query = location.search.replace(/^\?/, '');
  var home = document.getElementById('home');
  var view = document.getElementById('view');

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function commas(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function load(src, done) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = done;
    document.head.appendChild(s);
  }

  function searchBox(term) {
    return '<form class="filterbox" action="./" method="get" align="center">\n' +
      '<font size="2"><input name="q" size="28" value="' + esc(term || '') +
      '" autocomplete="off" spellcheck="false">' +
      ' <button type="submit">search</button></font>\n</form>\n';
  }

  function navLine() {
    return '<p class="lead" align="center"><font size="2">' +
      '<a href="./">front door</a> &middot; ' +
      '<a href="sites.html">directory</a> &middot; ' +
      '<a href="countries.html">countries</a> &middot; ' +
      '<a href="plugs.html">plugs</a> &middot; ' +
      '<a href="gallery.html">photos</a> &middot; ' +
      '<a href="live.html">live</a>' +
      '</font></p>\n';
  }

  function show(html) {
    if (home) home.style.display = 'none';
    if (!view) return;
    view.innerHTML = searchBox(state.term) + html + navLine();
    view.style.display = '';
  }

  function fail(msg) {
    show('<div class="message" align="center">\n<font size="2">' + esc(msg) +
      '</font>\n</div>\n');
  }

  /* ------------------------------------------------------------- the state */
  var state = { term: '' };

  var key = '';
  var value = '';
  if (query.indexOf('q=') === 0 || query.indexOf('s=') === 0) {
    key = 'search';
    value = query.slice(2);
  } else if (query.indexOf('?=') === 0 || query.indexOf('=%3d') === 0 || query.indexOf('=%3D') === 0) {
    key = 'search';
    value = query.replace(/^(\?|=)/, '').replace(/^%3d/i, '').replace(/^=/, '');
  } else if (query.indexOf('=') === 0) {
    key = 'search';
    value = query.slice(1);
  } else if (query.indexOf('=') > 0) {
    var cut = query.indexOf('=');
    key = query.slice(0, cut);
    value = query.slice(cut + 1);
  } else if (query) {
    key = query;
    value = '';
  }
  try {
    key = decodeURIComponent(key).toLowerCase();
    value = decodeURIComponent(value.replace(/\+/g, ' '));
    if (key === '%3d' || key === '=') {
      key = 'search';
    }
  } catch (e) { /* malformed escapes: use as typed */ }

  if (!key) return;                       /* plain front page, nothing to do */

  /* --------------------------------------------------------------- helpers */
  function siteRow(s, showRoom) {
    var host = String(s.u || '').replace(/^https?:\/\//, '').replace(/^www\./, '')
      .split('/')[0];
    return '<li><a class="ext" href="' + esc(s.u) + '" rel="noopener noreferrer">' +
      esc(s.name) + '</a><span class="host">' + esc(host) + '</span>' +
      '<span class="snip">' + esc(s.d) + '</span>' +
      (showRoom ? '<span class="chip">' + esc(s.c) + '</span>' : '') + '</li>';
  }

  function list(items, empty) {
    return items.length
      ? '<ul class="entrylist">\n' + items.join('\n') + '\n</ul>\n'
      : '<div class="message" align="center"><font size="2">' + esc(empty) +
        '</font></div>\n';
  }

  var picks = window.MUSEUM_PICKS || { sites: [], relics: [] };
  var sites = picks.sites || [];
  var relics = picks.relics || [];

  function roomsOf() {
    var seen = {}, out = [];
    sites.forEach(function (s) {
      if (!seen[s.c]) { seen[s.c] = 0; out.push(s.c); }
      seen[s.c]++;
    });
    return out.sort().map(function (c) {
      return { c: c, n: seen[c] };
    });
  }

  /* ---------------------------------------------------------------- search */
  function doSearch(term) {
    state.term = term;
    var t = term.trim().toLowerCase();
    if (!t) {
      return show('<div class="message" align="center"><font size="2">' +
        'Type a word after the = sign, for example <b>?=finance</b>.' +
        '</font></div>\n');
    }

    var hitSites = sites.filter(function (s) {
      return (s.n + ' ' + s.d + ' ' + s.c + ' ' + s.u).toLowerCase().indexOf(t) >= 0;
    });
    var hitRelics = relics.filter(function (r) {
      return (r.n + ' ' + r.m + ' ' + r.p + ' ' + r.d).toLowerCase().indexOf(t) >= 0;
    });

    var html = '<h2>Search</h2>\n\n<p class="lead" align="center">' +
      '<font size="2">' + hitSites.length + ' sites and ' + hitRelics.length +
      ' objects match <b>' + esc(term) + '</b>.</font></p>\n\n';

    html += '<h3>Sites (' + hitSites.length + ')</h3>\n' +
      list(hitSites.slice(0, 100).map(function (s) { return siteRow(s, true); }),
        'No site matches.');

    if (hitRelics.length) {
      html += '<h3>Objects (' + hitRelics.length + ')</h3>\n' +
        '<ul class="entrylist">\n' + hitRelics.map(function (r) {
          return '<li><a class="ext" href="' + esc(r.u) +
            '" rel="noopener noreferrer">' + esc(r.n) + '</a>' +
            '<span class="host">' + esc(r.m) + ', ' + esc(r.p) + '</span>' +
            '<span class="snip">' + esc(r.d) + '</span></li>';
        }).join('\n') + '\n</ul>\n';
    }

    /* countries need the big file, so look them up second */
    load('countries.js', function () {
      var cs = window.MUSEUM_COUNTRIES || [];
      var hit = cs.filter(function (c) {
        return (c.n + ' ' + c.o + ' ' + c.cap + ' ' + c.reg).toLowerCase()
          .indexOf(t) >= 0;
      });
      if (view && hit.length) {
        view.innerHTML += '<h3>Countries (' + hit.length + ')</h3>\n' +
          '<ul class="plainlist cols">\n' + hit.map(function (c) {
            return '<li>' + (c.flag ? esc(c.flag) + ' ' : '') +
              '<a href="?country=' + esc(c.slug) + '">' + esc(c.n) + '</a>' +
              '<span class="host">' + esc(c.cap || '') + '</span></li>';
          }).join('\n') + '\n</ul>\n';
      }
    });

    show(html);
  }

  /* --------------------------------------------------------------- routing */
  /* a few sections are prose written into their own page; send them there
     rather than keeping two copies of the same text */
  var ELSEWHERE = {
    about: 'about.html', contact: 'contact.html', submit: 'contact.html',
    exhibition: 'exhibition.html', links: 'links.html',
    acknowledgments: 'acknowledgments.html', sitemap: 'sitemap.html',
    live: 'live.html', home: './', index: './'
  };
  if (ELSEWHERE[key]) {
    if (home) home.style.display = 'none';
    location.replace(ELSEWHERE[key]);
    return;
  }

  if (key === 'search' || key === 'q' || key === 'find' || key === 's') {
    doSearch(value);
    return;
  }

  if (key === 'sites' || key === 'directory' || key === 'collection') {
    show('<h2>The collection</h2>\n\n<p class="lead" align="center">' +
      '<font size="2">' + sites.length + ' real sites in ' +
      roomsOf().length + ' rooms.</font></p>\n\n' +
      list(sites.map(function (s) { return siteRow(s, true); }), 'Nothing filed yet.'));
    return;
  }

  if (key === 'rooms' || key === 'categories' || key === 'room' && !value) {
    var rooms = roomsOf();
    show('<h2>Rooms</h2>\n\n<p class="lead" align="center"><font size="2">' +
      rooms.length + ' rooms.</font></p>\n\n<ul class="plainlist cols">\n' +
      rooms.map(function (r) {
        return '<li><a href="?room=' + esc(r.c) + '">' + esc(r.c) + '</a>' +
          '<font size="2" color="#808080"> (' + r.n + ')</font></li>';
      }).join('\n') + '\n</ul>\n');
    return;
  }

  if (key === 'room' || key === 'cat') {
    var inRoom = sites.filter(function (s) { return s.c === value.toLowerCase(); });
    show('<h2>' + esc(value) + '</h2>\n\n<p class="lead" align="center">' +
      '<font size="2">' + inRoom.length + ' sites in this room.</font></p>\n\n' +
      list(inRoom.map(function (s) { return siteRow(s, false); }),
        'No room called ' + value + '.') + '\n' +
      '<p class="lead" align="center"><font size="2">' +
      '<a href="?rooms">all rooms</a></font></p>\n');
    return;
  }

  if (key === 'gallery' || key === 'photos' || key === 'relics' || key === 'objects') {
    show('<h2>Photos</h2>\n\n<p class="lead" align="center"><font size="2">' +
      relics.length + ' objects held by real museums.</font></p>\n\n' +
      '<div class="gallery">\n' + relics.map(function (r) {
        return '<figure class="piece"><a href="' + esc(r.u) +
          '" rel="noopener noreferrer"><img src="' + esc(r.f) +
          '" alt="' + esc(r.n) + '" loading="lazy"></a>' +
          '<figcaption><b>' + esc(r.n) + '</b><br>' +
          '<span class="host">' + esc(r.m) + ', ' + esc(r.p) + '</span><br>' +
          '<span class="snip">' + esc(r.d) + '</span></figcaption></figure>';
      }).join('\n') + '\n</div>\n');
    return;
  }

  /* above needs nothing extra; below this line the country file is required */
  var needsWorld = (key === 'countries' || key === 'country' || key === 'plugs' ||
    key === 'plug');
  if (!needsWorld) {
    /* unknown short name: try it as a search term rather than dead-ending */
    doSearch(query);
    return;
  }

  load('countries.js', function () {
    load('plugs.js', function () {
      world(key, value);
    });
  });

  function world(k, v) {
    var cs = window.MUSEUM_COUNTRIES || [];
    var plugs = window.MUSEUM_PLUGS || [];

    if (k === 'countries') {
      var by = {}, order = [];
      cs.forEach(function (c) {
        var r = c.reg || 'Other';
        if (!by[r]) { by[r] = []; order.push(r); }
        by[r].push(c);
      });
      order.sort();
      show('<h2>Countries</h2>\n\n<p class="lead" align="center"><font size="2">' +
        cs.length + ' countries and territories.</font></p>\n\n' +
        order.map(function (r) {
          return '<h3>' + esc(r) + '</h3>\n<ul class="plainlist cols">\n' +
            by[r].map(function (c) {
              return '<li>' + (c.flag ? esc(c.flag) + ' ' : '') +
                '<a href="?country=' + esc(c.slug) + '">' + esc(c.n) + '</a></li>';
            }).join('\n') + '\n</ul>\n';
        }).join('\n'));
      return;
    }

    if (k === 'country') {
      var c = null;
      cs.forEach(function (x) {
        if (x.slug === v.toLowerCase() || x.n.toLowerCase() === v.toLowerCase() ||
            x.c3.toLowerCase() === v.toLowerCase() ||
            String(x.c2).toLowerCase() === v.toLowerCase()) c = x;
      });
      if (!c) return fail('No country called ' + v + '.');

      var rows = [
        ['official name', c.o], ['capital', c.cap || '-'],
        ['population', c.pop ? commas(c.pop) : '-'],
        ['area', c.area ? commas(c.area) + ' km2' : '-'],
        ['region', [c.reg, c.sub].filter(Boolean).join(' / ')],
        ['languages', (c.langs || []).join(', ')],
        ['currency', (c.cur || []).join(', ')],
        ['calling code', c.idd],
        ['mains power', (c.plug || []).join(', ') +
          (c.volt ? ', ' + c.volt : '') + (c.hz ? ', ' + c.hz : '')],
        ['drives on', c.side === 'LHT' ? 'the left' : c.side === 'RHT' ? 'the right' : '-'],
        ['time zones', (c.tz || []).slice(0, 4).join(', ')]
      ];

      show('<h2>' + (c.flag ? esc(c.flag) + ' ' : '') + esc(c.n) + '</h2>\n\n' +
        '<table class="formtable" width="720" cellpadding="0" cellspacing="0" border="0">\n' +
        rows.map(function (r) {
          return '<tr><td width="190" align="right" valign="top"><font size="2">' +
            esc(r[0]) + '</font></td><td valign="top"><font size="2">' +
            esc(r[1] || '-') + '</font></td></tr>\n';
        }).join('') + '</table>\n\n' +
        '<p class="lead" align="center"><font size="2">' +
        '<a href="countries/' + esc(c.slug) + '.html">the full page</a> &middot; ' +
        '<a href="?countries">all countries</a></font></p>\n');
      return;
    }

    if (k === 'plugs' || k === 'plug') {
      var users = {};
      cs.forEach(function (c) {
        (c.plug || []).forEach(function (p) { (users[p] = users[p] || []).push(c); });
      });

      if (k === 'plug' && v) {
        var letter = v.toUpperCase().charAt(0);
        var p = null;
        plugs.forEach(function (x) { if (x.letter === letter) p = x; });
        if (!p) return fail('No plug type ' + letter + '.');
        show('<h2>Type ' + esc(letter) + '</h2>\n\n' +
          '<p class="lead" align="center"><font size="2">' + esc(p.name) +
          '</font></p>\n\n' +
          (p.file ? '<p align="center"><img src="' + esc(p.file) +
            '" alt="type ' + esc(letter) + '"></p>\n\n' : '') +
          '<div class="message"><font size="2">' + esc(p.desc) + '</font></div>\n\n' +
          list((users[letter] || []).map(function (c) {
            return '<li><a href="?country=' + esc(c.slug) + '">' + esc(c.n) + '</a></li>';
          }), 'Nobody recorded using this type.'));
        return;
      }

      show('<h2>Plugs</h2>\n\n<p class="lead" align="center"><font size="2">' +
        plugs.length + ' types in use.</font></p>\n\n<div class="plugs">\n' +
        plugs.map(function (p) {
          var n = (users[p.letter] || []).length;
          return '<div class="plugrow"><b><a href="?plug=' + esc(p.letter) + '">' +
            'Type ' + esc(p.letter) + '</a></b> &mdash; ' + esc(p.name) +
            ' <span class="host">' + n + ' countries</span><br>' +
            '<span class="snip">' + esc(p.desc) + '</span></div>\n';
        }).join('') + '\n</div>\n');
      return;
    }
  }
})();
