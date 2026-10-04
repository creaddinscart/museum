/* Progressive enhancement for the museum pages.
   Everything on the site works without this file; it only adds:
   - a live filter on sites.html
   - "/" focuses the filter, Escape clears it
   All pages are static HTML, so nothing here is required for navigation. */

(function () {
  'use strict';

  var input = document.getElementById('filter');
  var tally = document.getElementById('filterCount');

  if (input) {
    var items = Array.prototype.slice.call(
      document.querySelectorAll('h3[id^="room-"] + .lead, h3[id^="room-"], ul.entrylist > li')
    );
    var rows = items.filter(function (node) {
      return node.tagName === 'LI';
    });
    var heads = items.filter(function (node) {
      return node.tagName === 'H3';
    });

    input.addEventListener('input', function () {
      var needle = input.value.trim().toLowerCase();
      var hits = 0;

      rows.forEach(function (row) {
        var match = !needle || row.textContent.toLowerCase().indexOf(needle) >= 0;
        row.hidden = !match;
        if (match) hits++;
      });

      heads.forEach(function (head) {
        var block = head.parentNode.querySelectorAll('ul.entrylist > li');
        var visible = Array.prototype.filter.call(block, function (li) {
          return !li.hidden;
        });
        head.hidden = !!needle && !visible.length;
      });

      if (tally) {
        tally.textContent = needle ? hits + ' of ' + rows.length : '';
      }
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

  /* mark the current page in the two navigation rows */
  var here = location.pathname.split('/').pop() || 'index.html';
  Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (link) {
    if (link.getAttribute('href') === here ||
        (here === '' && link.getAttribute('href') === 'index.html')) {
      link.className = 'current';
    }
  });
})();
