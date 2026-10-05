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

  /* -------------------------------------------------- filter on sites.html */
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

  /* ----------------------------------------- mark the current page in the nav */
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (link) {
    if (link.getAttribute('href') === here ||
        (here === '' && link.getAttribute('href') === 'index.html')) {
      link.className = 'current';
    }
  });
})();
