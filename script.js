/* Progressive enhancement for the museum pages.
   The directory itself is static HTML and navigates fully without this file.
   Here it only adds a live filter on sites.html and marks the current page
   in the navigation rows. */

(function () {
  'use strict';

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* --------------------------------- live filter (sites / countries pages) */
  var input = document.getElementById('filter');
  var tally = document.getElementById('filterCount');

  if (input) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(
      'ul.entrylist > li, ul.plainlist.cols > li, h3[id^="room-"], h3[id^="reg-"]'
    ));
    var rows = nodes.filter(function (n) { return n.tagName === 'LI'; });
    var heads = nodes.filter(function (n) { return n.tagName === 'H3'; });

    input.addEventListener('input', function () {
      var needle = input.value.trim().toLowerCase();
      var hits = 0;

      rows.forEach(function (row) {
        var hit = !needle || row.textContent.toLowerCase().indexOf(needle) >= 0;
        row.hidden = !hit;
        if (hit) hits++;
      });

      heads.forEach(function (head) {
        var next = head.nextElementSibling;
        var visible = next && next.tagName === 'UL'
          ? next.querySelectorAll('li:not([hidden])')
          : head.parentNode.querySelectorAll('ul.entrylist > li:not([hidden])');
        head.hidden = !!needle && !visible.length;
      });

      if (tally) tally.textContent = needle ? hits + ' of ' + rows.length : '';
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && document.activeElement !== input) {
        event.preventDefault();
        input.focus();
      } else if (event.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        input.blur();
      }
    });
  }


  /* ---------------------------------------------------------------- live */
  /* Reads public, key-free APIs from the browser. Every block is optional:
     if a source refuses, that block alone says so and the rest carry on. */
  var COINS = [
    ['bitcoin', 'Bitcoin'], ['ethereum', 'Ethereum'], ['tether', 'Tether'],
    ['binancecoin', 'BNB'], ['solana', 'Solana'], ['ripple', 'XRP'],
    ['cardano', 'Cardano'], ['dogecoin', 'Dogecoin'], ['tron', 'TRON'],
    ['avalanche-2', 'Avalanche'], ['chainlink', 'Chainlink'],
    ['polkadot', 'Polkadot'], ['litecoin', 'Litecoin'], ['stellar', 'Stellar'],
    ['monero', 'Monero'], ['cosmos', 'Cosmos']
  ];

  var FX = ['EUR', 'GBP', 'JPY', 'CNY', 'CHF', 'CAD', 'AUD', 'SEK',
            'NZD', 'ZAR', 'BRL', 'INR', 'MXN', 'KRW', 'SGD', 'HKD',
            'NOK', 'PLN', 'TRY', 'THB'];

  var CITIES = [
    ['London', 51.51, -0.13], ['New York', 40.71, -74.01],
    ['Tokyo', 35.69, 139.69], ['Beijing', 39.90, 116.41],
    ['Sydney', -33.87, 151.21], ['Cairo', 30.04, 31.24],
    ['Reykjavik', 64.15, -21.94], ['Nairobi', -1.29, 36.82],
    ['Sao Paulo', -23.55, -46.63], ['Mumbai', 19.08, 72.88]
  ];

  function boxFor(id) {
    return document.querySelector('[data-live="' + id + '"]');
  }

  function note(msg) {
    return '<font size="2" color="#808080">' + esc(msg) + '</font>';
  }

  function jget(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function money(v) {
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (Math.abs(n) >= 1) return n.toFixed(2);
    if (Math.abs(n) >= 0.01) return n.toFixed(4);
    return n.toFixed(6);
  }

  /* rises show red, falls show green, as the collector reads them */
  function change(pct) {
    if (pct === null || pct === undefined || !isFinite(pct)) return '';
    var up = pct >= 0;
    var col = up ? '#c00000' : '#007a00';
    return ' <font color="' + col + '">' + (up ? '+' : '') + pct.toFixed(2) + '%</font>';
  }

  function rows(list) {
    return '<table class="livetable" width="100%" cellpadding="0" cellspacing="0" border="0">\n' +
      list.map(function (r) {
        return '<tr><td align="left"><font size="2">' + r[0] + '</font></td>' +
          '<td align="right"><font size="2">' + r[1] + '</font></td></tr>\n';
      }).join('') + '</table>\n';
  }

  function plain(items) {
    return '<ul class="plainlist">\n' + items.map(function (i) {
      return '<li>' + i + '</li>\n';
    }).join('') + '</ul>\n';
  }

  var PANELS = {
    picks: function (box) {
      drawPicks(box);
      return Promise.resolve();
    },

    crypto: function (box) {
      var ids = COINS.map(function (c) { return c[0]; }).join(',');
      return jget('https://api.coingecko.com/api/v3/simple/price?ids=' + ids +
        '&vs_currencies=usd&include_24hr_change=true').then(function (d) {
        var list = COINS.map(function (c) {
          var v = d[c[0]];
          if (!v) return null;
          return [esc(c[1]), '$' + money(v.usd) + change(v.usd_24h_change)];
        }).filter(Boolean);
        box.innerHTML = list.length ? rows(list)
          : note('CoinGecko returned nothing. Try again in a minute.');
      });
    },

    fx: function (box) {
      return jget('https://api.frankfurter.app/latest?from=USD').then(function (d) {
        var list = FX.filter(function (k) { return d.rates[k]; }).map(function (k) {
          return ['1 USD = ' + esc(k), money(d.rates[k])];
        });
        box.innerHTML = rows(list) +
          '<p class="lead"><font size="2" color="#808080">Reference rate for ' +
          esc(d.date) + '.</font></p>\n';
      });
    },

    fear: function (box) {
      return jget('https://api.alternative.me/fng/?limit=1').then(function (d) {
        var f = (d.data || [])[0];
        box.innerHTML = f
          ? '<p class="lead"><font size="2"><b>' + esc(f.value) + '</b> &mdash; ' +
            esc(f.value_classification) + '<br><span class="host">scored ' +
            esc(new Date(Number(f.timestamp) * 1000).toISOString().slice(0, 10)) +
            '</span></font></p>\n'
          : note('No reading available.');
      });
    },

    tech: function (box) {
      return jget('https://hacker-news.firebaseio.com/v0/topstories.json')
        .then(function (ids) {
          return Promise.all(ids.slice(0, 10).map(function (id) {
            return jget('https://hacker-news.firebaseio.com/v0/item/' + id + '.json')
              .catch(function () { return null; });
          }));
        }).then(function (items) {
          var list = items.filter(Boolean).slice(0, 10).map(function (it) {
            var host = '';
            try { host = new URL(it.url || '').hostname.replace(/^www\./, ''); } catch (e) { host = ''; }
            return '<a class="ext" href="' + esc(it.url ||
              ('https://news.ycombinator.com/item?id=' + it.id)) +
              '" rel="noopener noreferrer">' + esc(it.title) + '</a>' +
              (host ? '<span class="host">' + esc(host) + '</span>' : '') +
              '<span class="host">' + (it.score || 0) + ' points</span>';
          });
          box.innerHTML = list.length ? plain(list) : note('No stories returned.');
        });
    },

    quakes: function (box) {
      return jget('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/' +
        'significant_week.geojson').then(function (d) {
        var list = (d.features || []).slice(0, 8).map(function (f) {
          var p = f.properties, c = f.geometry.coordinates;
          var when = new Date(p.time).toISOString().slice(0, 16).replace('T', ' ');
          return '<b>' + (p.mag ? p.mag.toFixed(1) : '-') + '</b> ' + esc(p.place || 'unknown') +
            '<span class="host">' + when + ' UTC &middot; depth ' +
            (c[2] !== null && c[2] !== undefined ? Math.round(c[2]) + ' km' : '-') + '</span>';
        });
        box.innerHTML = list.length ? plain(list)
          : note('Nothing significant in the last seven days.');
      });
    },

    space: function (box) {
      var iss = jget('https://api.wheretheiss.at/v1/satellites/25544')
        .then(function (d) {
          return '<b>International Space Station</b><span class="host">' +
            Math.abs(d.latitude).toFixed(2) + '&deg; ' + (d.latitude >= 0 ? 'N' : 'S') + ', ' +
            Math.abs(d.longitude).toFixed(2) + '&deg; ' + (d.longitude >= 0 ? 'E' : 'W') +
            ' &middot; ' + Math.round(d.altitude) + ' km up &middot; ' +
            Math.round(d.velocity) + ' km/h</span>';
        }).catch(function () { return '<span class="host">Station position unavailable.</span>'; });

      var apod = jget('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY&thumbs=true')
        .then(function (d) {
          if (!d || !d.title) return '';
          var img = d.media_type === 'image'
            ? '<br><a href="' + esc(d.url) + '" rel="noopener noreferrer">' +
              '<img src="' + esc(d.thumbnail_url || d.url) + '" alt="' + esc(d.title) +
              '" width="420" loading="lazy"></a>'
            : '';
          return '<b>' + esc(d.title) + '</b><span class="host">NASA picture of the day, ' +
            esc(d.date) + (d.copyright ? ' &middot; ' + esc(d.copyright) : '') + '</span>' + img;
        }).catch(function () { return ''; });

      return Promise.all([iss, apod]).then(function (parts) {
        box.innerHTML = plain(parts.filter(Boolean));
      });
    },

    weather: function (box) {
      var jobs = CITIES.map(function (c) {
        var u = 'https://api.open-meteo.com/v1/forecast?latitude=' + c[1] +
          '&longitude=' + c[2] + '&current=temperature_2m,wind_speed_10m,weather_code';
        return jget(u).then(function (d) {
          var cur = d.current || {};
          return [esc(c[0]), (cur.temperature_2m !== undefined
            ? cur.temperature_2m.toFixed(1) + '&deg;C' : '-') +
            (cur.wind_speed_10m !== undefined
              ? ' <span class="host">wind ' + Math.round(cur.wind_speed_10m) + ' km/h</span>' : '')];
        }).catch(function () { return null; });
      });
      return Promise.all(jobs).then(function (r) {
        var list = r.filter(Boolean);
        box.innerHTML = list.length ? rows(list) : note('No weather returned.');
      });
    }
  };

  function drawPicks(box) {
    var picks = window.MUSEUM_PICKS;
    if (!picks) return;
    var sites = picks.sites || [], relics = picks.relics || [];

    function pick(arr, n) {
      var pool = arr.slice(), out = [];
      while (pool.length && out.length < n) {
        out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      return out;
    }

    var chosen = pick(sites, 2).map(function (s) {
      return '<li><a class="ext" href="' + esc(s.u) + '" rel="noopener noreferrer">' +
        esc(s.n) + '</a><span class="host">' + esc(s.u.replace(/^https?:\/\//, '')
          .replace(/^www\./, '').split('/')[0]) + '</span>' +
        '<span class="snip">' + esc(s.d) + '</span>' +
        '<span class="chip">' + esc(s.c) + '</span></li>';
    });

    pick(relics, 1).forEach(function (r) {
      chosen.push('<li><a class="ext" href="' + esc(r.u) + '" rel="noopener noreferrer">' +
        esc(r.n) + '</a><span class="host">' + esc(r.m) + ', ' + esc(r.p) + '</span>' +
        '<span class="snip">' + esc(r.d) + '</span></li>');
    });

    if (!chosen.length) return;
    box.innerHTML = '<ul class="entrylist">\n' + chosen.join('\n') + '\n</ul>\n';
  }

  (function () {
    var present = {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-live]'), function (b) {
      present[b.getAttribute('data-live')] = true;
    });
    if (!Object.keys(present).length) return;

    var stamp = document.getElementById('liveStamp');
    var tick = document.getElementById('liveTick');
    var seconds = 60;

    function stampNow() {
      if (stamp) stamp.textContent = new Date().toUTCString().replace('GMT', 'UTC');
    }

    function runOne(id) {
      var box = boxFor(id);
      if (!box) return Promise.resolve();
      var job = PANELS[id];
      if (!job) return Promise.resolve();
      return job(box).catch(function (err) {
        box.innerHTML = note('Could not reach this source (' + esc(err.message) + ').');
      });
    }

    function runAll() {
      Object.keys(present).forEach(runOne);
      stampNow();
      seconds = 60;
    }

    if (present.random && boxFor('random')) drawPicks(boxFor('random'));
    runAll();

    setInterval(function () {
      seconds--;
      if (tick) tick.textContent = seconds > 0 ? '(next update in ' + seconds + 's)' : '';
      if (seconds <= 0) runAll();
    }, 1000);
  })();

  /* ----------------------------------------- mark the current page in the nav */
  var path = location.pathname;
  var here = path.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (link) {
    var href = link.getAttribute('href');
    var samePage = href === here || (here === '' && href === 'index.html');
    /* every country page belongs to the countries section */
    var inSection = href === 'countries.html' &&
      (here === 'countries.html' || path.indexOf('/countries/') >= 0);
    if (samePage || inSection) link.className = 'current';
  });
})();
