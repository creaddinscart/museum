/* Progressive enhancement for the museum pages.
   Everything here is optional; the directory itself is static HTML and navigates
   without JavaScript. This file adds:
   1. a live filter on sites.html
   2. visitor submitted entries, stored in localStorage, always rendered with a
      visible "not verified" warning, above the checked collection
   3. the submit form on submit.html
*/

(function () {
  'use strict';

  var GUEST_KEY = 'museum.guests.v1';

  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hostOf(url) {
    return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }

  function read() {
    try {
      var raw = localStorage.getItem(GUEST_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (err) {
      return [];
    }
  }

  function save(list) {
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(list));
    } catch (err) {}
  }

  /* ------------------------------------------------ 1. filter on sites.html */
  var input = document.getElementById('filter');
  var tally = document.getElementById('filterCount');

  if (input) {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(
      'ul.entrylist > li, h3[id^="room-"]'
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
        var visible = head.parentNode.querySelectorAll(
          'ul.entrylist > li:not([hidden])'
        );
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

  /* --------------------------------------------- 2. visitor submitted entries */
  function renderGuests() {
    var boxes = document.querySelectorAll('.guestbox[data-guest]');
    if (!boxes.length) return;

    var all = read();

    Array.prototype.forEach.call(boxes, function (box) {
      var what = box.getAttribute('data-guest');
      var list = what === 'all'
        ? all
        : all.filter(function (g) { return g.cat === what; });

      if (!list.length) {
        box.innerHTML = '';
        box.hidden = true;
        return;
      }

      box.hidden = false;
      box.innerHTML =
        '<p class="guesthead"><font size="2" color="#c00000">' +
          'visitor submission' + (list.length > 1 ? 's' : '') + ' (' + list.length + ')' +
          ' &mdash; suggested by visitors, not verified by the museum' +
        '</font></p>\n' +
        '<ul class="entrylist guest">\n' + list.map(function (g) {
          return '<li>' +
            '<span class="flag">visitor submission</span>\n' +
            '<a class="ext" href="' + esc(g.url) + '" rel="noopener noreferrer">' +
              esc(g.name) + '</a>' +
            '<span class="host">' + esc(hostOf(g.url)) + '</span>\n' +
            '<span class="chip">' + esc(g.cat) + '</span>\n' +
            '<button class="rm" type="button" data-del="' + esc(g.url) + '">remove</button>\n' +
            '<span class="snip">' + esc(g.desc) + '</span>\n' +
            '</li>';
        }).join('\n') + '\n</ul>\n';
    });
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest ? event.target.closest('button[data-del]') : null;
    if (!button) return;
    var url = button.getAttribute('data-del');
    save(read().filter(function (g) { return g.url !== url; }));
    renderGuests();
  });

  renderGuests();

  /* ------------------------------------------------------- 3. the submit form */
  var form = document.getElementById('submitForm');
  var output = document.getElementById('sfResult');
  var status = document.getElementById('sfStatus');
  var github = document.getElementById('sfGithub');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var url = document.getElementById('sfUrl').value.trim();
      var name = document.getElementById('sfName').value.trim();
      var cat = document.getElementById('sfCat').value;
      var desc = document.getElementById('sfDesc').value.trim();
      var trap = document.getElementById('sfTrap').value;
      var agreed = document.getElementById('sfConfirm').checked;

      function fail(message) {
        status.textContent = '';
        output.innerHTML = '<font size="2" color="#c00000">' + esc(message) + '</font>';
      }

      if (trap) return;
      if (!agreed) return fail('Please tick the confirmation box first.');
      if (!/^https:\/\/[^\s/]+\.[^\s/]+/.test(url)) {
        return fail('The address must start with https:// and include a domain.');
      }
      if (!name || !desc) return fail('Name and description are both required.');
      if (desc.length < 12) return fail('Description is a little short; one sentence please.');

      var list = read();
      if (list.some(function (g) { return g.url === url; })) {
        return fail('Already submitted from this browser.');
      }

      list.push({ url: url, name: name, cat: cat, desc: desc, at: Date.now() });
      save(list);
      renderGuests();
      form.reset();

      if (github) {
        github.href = 'https://github.com/creaddinscart/museum/issues/new' +
          '?labels=visitor-submission' +
          '&title=' + encodeURIComponent('Site submission: ' + name) +
          '&body=' + encodeURIComponent(
            'name: ' + name + '\nurl: ' + url + '\nroom: ' + cat +
            '\ndescription: ' + desc + '\n'
          );
      }

      status.textContent = '';
      output.innerHTML = '<font size="2">Filed under <b>' + esc(cat) + '</b> and marked ' +
        '<b>visitor submission</b>.<br>\n' +
        '<a href="categories/' + esc(cat) + '.html">see it in its room</a> &middot;\n' +
        '<a href="submissions.html">all visitor submissions</a> &middot;\n' +
        '<a href="' + esc(github ? github.href : '#') + '">request verification on GitHub</a>\n' +
        '</font>';
    });
  }

  /* ----------------------------------------- mark the current page in the nav */
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (link) {
    if (link.getAttribute('href') === here ||
        (here === '' && link.getAttribute('href') === 'index.html')) {
      link.className = 'current';
    }
  });
})();
