/* build.js — generates the static pages of the museum from sites.js.
   usage: node build.js */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = 'https://m.shit.pub/';
const REPO = 'creaddinscart/museum';
const TOTAL_TITLE = 'Digital Museum of Professional Websites';

const window = {};
eval(fs.readFileSync(path.join(ROOT, 'sites.js'), 'utf8'));
const SITES = window.MUSEUM_SITES;

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function hostOf(url) {
  return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
}

/* group preserves the order in which each room first appears */
const order = [];
const rooms = {};
SITES.forEach(function (s) {
  if (!rooms[s.cat]) {
    rooms[s.cat] = [];
    order.push(s.cat);
  }
  rooms[s.cat].push(s);
});
const CATS = order.slice().sort(function (a, b) { return a.localeCompare(b); });

/* words at the head of each room */
const ROOM_NOTE = {
  technology: 'Languages, libraries and frameworks, plus the reference material that keeps them upright.',
  cloud: 'The utilities: compute, storage and managed plumbing rented by the hour.',
  ai: 'Machine learning: the frameworks, the model commons and the labs publishing them.',
  hardware: 'Silicon, drivers and the tooling needed to speak to it directly.',
  standards: 'The bodies that argue about how packets and documents are supposed to behave.',
  academic: 'Professional societies and working archives of the computing and engineering trades.',
  science: 'Journals and institutions where results are published before they harden into fact.',
  biology: 'Cells, proteins and genomes, with the databases they are filed in.',
  medical: 'Clinical evidence, from preprint servers to bedside reference volumes.',
  education: 'Universities and the platforms that put their teaching online.',
  language: 'Vocabulary practice, conjugation drills and the odd unamused owl.',
  space: 'Agencies and companies that put hardware above the atmosphere.',
  physics: 'Particle physics, fusion experiments and the instruments built to catch them.',
  environment: 'Weather, climate and the long datasets used to argue about both.',
  earth: 'Geology, hydrology and mapping: the ground under everything else.',
  health: 'Public health authorities and the funders behind most medical research.',
  international: 'Organisations where states meet, argue and occasionally agree.',
  finance: 'Banking, markets and the publications that report on them daily.',
  trade: 'Tariffs, disputes and the rules governing cross-border commerce.',
  economics: 'Statistics and analysis, mostly comparable between rich economies.',
  news: 'Wire services, broadcasters and newspapers with global reach.',
  business: 'Company building: sales, hiring, meetings and the software for each.',
  management: 'Strategy essays and the vocabulary they export to every boardroom.',
  consulting: 'Advisory firms, their frameworks and their research arms.',
  accounting: 'Audit, tax and advisory networks present in every major market.',
  markets: 'Exchanges, listings and the derivatives traded in enormous size.',
  crypto: 'Digital assets: the exchanges, and the newsroom covering them.',
  design: 'Portfolios, tools and the places visual trends are set.',
  webdesign: 'Sites judged on their own terms, by people who build them.',
  architecture: 'Buildings, architects and the journals the profession reads.',
  art: 'Collections, galleries and marketplaces for original work.',
  museum: 'Institutions worth visiting in person, most with part of the collection online.',
  library: 'Books, recordings and the digitised papers of centuries past.',
  culture: 'Heritage aggregated from thousands of separate collections.',
  reference: 'Encyclopaedias and structured facts that everything else borrows from.',
  media: 'Talks, broadcasts and long form video from public broadcasters.',
  community: 'Forums, feeds and newsletters where people actually gather.',
  startup: 'Launch platforms, early funding announcements and the reports thereof.',
  engineering: 'Practitioners\' journals covering robotics, energy and infrastructure.',
  security: 'Advisories, databases of known flaws, and the tools used to test against them.',
  jobs: 'Boards and marketplaces for hiring, contracting and finding out what people are paid.',
  legal: 'Statutes and case law, published openly rather than behind a subscription.',
  productivity: 'Notes, boards and task lists; the paperwork of modern work.',
  enterprise: 'Software running the back office of very large organisations.',
  ecommerce: 'Marketplaces and the tooling that lets anyone sell online.',
  travel: 'Rooms, flights and hosting, plus the reviews that decide between them.',
  transport: 'Getting from one place to another, usually by application.'
};

function note(cat) {
  return ROOM_NOTE[cat] || ('Everything filed under ' + cat + '.');
}

function guestBox(what) {
  return '<div class="guestbox" data-guest="' + what + '"></div>';
}

const GUEST_ALL = guestBox('all');

const NAV = [
  { key: 'home', file: 'index.html', label: 'home' },
  { key: 'categories', file: 'categories.html', label: 'about the collection' },
  { key: 'sites', file: 'sites.html', label: 'the collection' },
  { key: 'contact', file: 'contact.html', label: 'submit a site' },
  { key: 'exhibition', file: 'exhibition.html', label: 'exhibition' },
  { key: 'acknowledgments', file: 'acknowledgments.html', label: 'acknowledgments' },
  { key: 'sitemap', file: 'sitemap.html', label: 'site map' },
  { key: 'links', file: 'links.html', label: 'links' },
  { key: 'about', file: 'about.html', label: 'about the collector' }
];

function navRow(key, prefix) {
  return '<tr>' + NAV.map(function (n) {
    var cell = '<td align="center"><font size="2">';
    if (n.key === key) cell += esc(n.label);
    else cell += '<a href="' + prefix + n.file + '">' + esc(n.label) + '</a>';
    return cell + '</font></td>';
  }).join('') + '</tr>';
}

function head(title, description, file) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(description) + '">\n' +
    '<meta name="robots" content="index, follow">\n' +
    '<meta name="author" content="' + TOTAL_TITLE + '">\n' +
    '<link rel="canonical" href="' + SITE + file + '">\n' +
    '<link rel="icon" type="image/svg+xml" href="favicon.svg">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(description) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:url" content="' + SITE + file + '">\n' +
    '<meta property="og:image" content="' + SITE + 'favicon.svg">\n' +
    '<link rel="stylesheet" href="style.css">\n' +
    '</head>\n<body>\n';
}

function page(opts) {
  var prefix = opts.prefix || '';
  var h = '<link rel="icon" type="image/svg+xml" href="' + prefix + 'favicon.svg">';
  var body = head(opts.title, opts.description, opts.file)
    .replace('<link rel="icon" type="image/svg+xml" href="favicon.svg">', h)
    .replace('<link rel="stylesheet" href="style.css">',
      '<link rel="stylesheet" href="' + prefix + 'style.css">');

  /* the 404 page must not be indexed */
  if (opts.noindex) {
    body = body.replace('<meta name="robots" content="index, follow">',
      '<meta name="robots" content="noindex, follow">');
  }

  if (opts.key !== 'home') {
    body += '<p class="minilogo" align="center">' +
      '<a href="' + prefix + 'index.html"><img src="' + prefix +
      'favicon.svg" width="46" height="46" alt="' + TOTAL_TITLE + '"></a></p>\n' +
      '<p class="brandline" align="center"><a href="' + prefix + 'index.html">' +
      TOTAL_TITLE + '</a></p>\n';
  }

  body += '<table class="topnav" width="720" cellpadding="0" cellspacing="0" border="0">\n' +
    navRow(opts.key, prefix) + '</table>\n\n<hr width="720">\n\n';

  body += opts.body;

  body += '\n<hr width="720">\n\n' +
    '<table class="topnav" width="720" cellpadding="0" cellspacing="0" border="0">\n' +
    navRow(opts.key, prefix) + '</table>\n\n' +
    '<p class="foot" align="center"><font size="2" color="#808080">&copy; 2009-2025 ' +
    TOTAL_TITLE + ' &middot; <a href="mailto:mail@shit.pub">mail@shit.pub</a> ' +
    '&middot; <a href="' + prefix + 'index.html">m.shit.pub</a></font></p>\n\n' +
    '<script src="' + prefix + 'script.js"></script>\n</body>\n</html>\n';

  return body;
}

function entryHtml(s, showRoom) {
  return '<li>' +
    '<a class="ext" href="' + esc(s.url) + '" rel="noopener noreferrer">' + esc(s.name) + '</a>' +
    '<span class="host">' + esc(hostOf(s.url)) + '</span>' +
    '<span class="snip">' + esc(s.desc) + '</span>' +
    (showRoom ? '<span class="chip">' + esc(s.cat) + '</span>' : '') +
    '</li>';
}

function write(file, contents) {
  var dest = path.join(ROOT, file);  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, contents);
  return file;
}

const built = [];

/* ---------------------------------------------------------------- index */
built.push(write('index.html', page({
  key: 'home',
  file: '',
  prefix: '',
  title: TOTAL_TITLE + ' - a curated directory of real professional websites',
  description: TOTAL_TITLE + ' - a curated directory of real professional websites across finance, science, technology, design and more.',
  body:
    '<div class="logo">\n<img src="favicon.svg" width="170" height="170" alt="' + TOTAL_TITLE + '">\n</div>\n\n' +
    '<h1 class="tagline">displaying an amazing variety of<br>professional websites from all over the world</h1>\n\n' +
    '<div class="enter">\n<a href="sites.html">ENTER&nbsp;&nbsp;MUSEUM</a>\n</div>\n\n' +
    '<table class="topnav" width="720" cellpadding="0" cellspacing="0" border="0">\n<tr>\n' +
    '<td align="left"><font size="2"><a href="categories.html">about the collection</a></font></td>\n' +
    '<td align="center"><font size="2">no cookies</font></td>\n' +
    '<td align="center"><font size="2">no password required</font></td>\n' +
    '<td align="right"><font size="2"><a href="about.html">about the collector</a></font></td>\n' +
    '</tr>\n</table>\n\n<hr width="720">\n\n' +
    '<table class="infobox" width="720" cellpadding="0" cellspacing="0" border="0">\n<tr>\n' +
    '<td width="33%" valign="top"><font size="2">&copy; 2009-2025 Digital Museum<br>All rights reserved.</font></td>\n' +
    '<td width="33%" valign="top" align="center"><font size="2">Reproduction of images and texts is allowed if the source:<br>"' +
    TOTAL_TITLE + '" and the internet<br>address <a href="https://m.shit.pub">m.shit.pub</a> are clearly indicated.</font></td>\n' +
    '<td width="33%" valign="top" align="right"><font size="2">Most recent update:<br>October 4, 2026<br>' +
    '<a href="sites.html">&gt; details / links &lt;</a></font></td>\n' +
    '</tr>\n</table>\n\n<hr width="720">\n\n' +
    '<table class="welcome" width="720" cellpadding="0" cellspacing="0" border="0">\n<tr>\n' +
    '<td width="55%" valign="top"><p><b>Welcome to the museum. Comments, questions and suggestions are appreciated.</b><br>\n' +
    '<i><font color="#c00000">The museum keeps an exhibition hall. Suggestions of new\n' +
    'rooms and new pieces are always welcome !</font></i></p></td>\n' +
    '<td width="45%" valign="top" align="right"><p><font size="2">\n' +
    '<a href="mailto:mail@shit.pub">mail@shit.pub</a><br>\n' +
    'Questions, corrections and sites sent in bulk are all welcome.<br>\n' +
    'A reply usually follows within a few days.</font></p></td>\n' +    '</tr>\n</table>\n\n<hr width="720">\n\n' +
    '<p align="center"><b><font color="#c00000">Collection at a glance</font></b></p>\n\n' +
    '<div class="message" align="center">\n<font size="2">\n' +
    SITES.length + ' real sites &middot; ' + CATS.length + ' rooms<br>\n' +
    '<a href="categories.html">browse the rooms</a> &middot;\n' +
    '<a href="sites.html">the complete directory</a> &middot;\n' +
    '<a href="sitemap.html">site map</a>\n' +
    '</font>\n</div>\n'
})));

/* ----------------------------------------------------------- categories */
(function () {
  var rows = CATS.map(function (c) {
    return '<li><a href="categories/' + c + '.html">' + esc(c) + '</a>' +
      '<font size="2" color="#808080"> (' + rooms[c].length + ')</font>' +
      '<span class="snip">' + esc(note(c)) + '</span></li>';
  }).join('\n');

  built.push(write('categories.html', page({
    key: 'categories',
    file: 'categories.html',
    prefix: '',
    title: 'Categories - ' + TOTAL_TITLE,
    description: 'Every room in the museum: ' + CATS.length + ' categories listing ' + SITES.length + ' real professional websites.',
    body:
      '<h2>Categories</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">' + CATS.length + ' rooms, ' + SITES.length +
      ' sites in total. Each room has its own page with descriptions and links.</font></p>\n\n' +
      '<ul class="entrylist">\n' + rows + '\n</ul>\n'
  })));
})();

/* ---------------------------------------------------------------- sites */
(function () {
  var jump = CATS.map(function (c) {
    return '<a href="#room-' + c + '">' + esc(c) + '</a>';
  }).join(' &middot; ');

  var blocks = CATS.map(function (c) {
    return '<h3 id="room-' + c + '">' + esc(c) + '</h3>\n' +
      '<p class="lead"><font size="2">' + esc(note(c)) + '</font></p>\n' +
      '<ul class="entrylist">\n' + rooms[c].map(function (s) {
        return entryHtml(s, false);
      }).join('\n') + '\n</ul>\n' +
      '<p class="back"><font size="2"><a href="categories/' + c + '.html">only this room &rarr;</a></font></p>\n';
  }).join('\n');

  built.push(write('sites.html', page({
    key: 'sites',
    file: 'sites.html',
    prefix: '',
    title: 'Sites - ' + TOTAL_TITLE,
    description: 'The complete directory: ' + SITES.length + ' real professional websites grouped into ' + CATS.length + ' rooms.',
    body:
      '<h2>Sites</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">Total: <b>' + SITES.length +
      '</b> real sites, all verified and clickable.</font></p>\n\n' +
      '<div class="filterbox" align="center">\n' +
      '<font size="2"><label for="filter">filter this page</label>\n' +
      '<input id="filter" type="search" size="28" autocomplete="off" spellcheck="false">\n' +
      '<span id="filterCount" class="tally"></span></font>\n</div>\n\n' +
      '<p class="jump"><font size="2">' + jump + '</font></p>\n\n' + blocks
  })));
})();

/* ----------------------------------------------------- one page per room */
CATS.forEach(function (c) {
  var sortable = CATS;
  var at = sortable.indexOf(c);
  var prev = at > 0 ? sortable[at - 1] : null;
  var next = at < sortable.length - 1 ? sortable[at + 1] : null;

  var pager = '<table class="pager" width="720" cellpadding="0" cellspacing="0" border="0">\n<tr>\n' +
    '<td align="left"><font size="2">' +
    (prev ? '<a href="' + prev + '.html">&larr; ' + esc(prev) + '</a>' : '&nbsp;') +
    '</font></td>\n' +
    '<td align="center"><font size="2"><a href="../categories.html">all categories</a></font></td>\n' +
    '<td align="right"><font size="2">' +
    (next ? '<a href="' + next + '.html">' + esc(next) + ' &rarr;</a>' : '&nbsp;') +
    '</font></td>\n' +
    '</tr>\n</table>\n';

  built.push(write('categories/' + c + '.html', page({
    key: 'categories',
    file: 'categories/' + c + '.html',
    prefix: '../',
    title: c.charAt(0).toUpperCase() + c.slice(1) + ' (' + rooms[c].length + ') - ' + TOTAL_TITLE,
    description: c + ': ' + rooms[c].length + ' real professional websites, with descriptions. ' + note(c),
    body:
      '<h2>' + esc(c) + '</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">' + esc(note(c)) + '<br>' +
      rooms[c].length + ' site' + (rooms[c].length === 1 ? '' : 's') + ' in this room.</font></p>\n\n' +
      pager + '\n\n' +
      '<ul class="entrylist">\n' + rooms[c].map(function (s) {
        return entryHtml(s, false);
      }).join('\n') + '\n</ul>\n\n' + pager
  })));
});

/* ------------------------------------------------------- static pages */
built.push(write('acknowledgments.html', page({
  key: 'acknowledgments',
  file: 'acknowledgments.html',
  prefix: '',
  title: 'Acknowledgments - ' + TOTAL_TITLE,
  description: 'Credits, sources and the rules under which the museum reuses material.',
  body:
    '<h2>Acknowledgments</h2>\n\n' +
    '<p class="lead" align="center"><font size="2">Every link in this museum was verified real and clickable.</font></p>\n\n' +
    '<div class="message">\n<font size="2">\n' +
    'The collection is assembled from public sources and from the institutions themselves.<br>\n' +
    'Descriptions are written in the museum\'s own words; nothing is copied from the sites.<br><br>\n' +
    'Donors of material are marked with an (NN) type abbreviation;<br>\n' +
    'full names are given here where permission has been granted.<br><br>\n' +
    'Site owners who would rather not be listed are removed on request,\n' +
    'no questions asked: <a href="mailto:mail@shit.pub">mail@shit.pub</a>.\n' +
    '</font>\n</div>\n'
})));

built.push(write('about.html', page({
  key: 'about',
  file: 'about.html',
  prefix: '',
  title: 'About the collector - ' + TOTAL_TITLE,
  description: 'Who keeps the museum, how the collection is maintained, and how to get in touch.',
  body:
    '<h2>About the collector</h2>\n\n' +
    '<div class="message">\n<font size="2">\n' +
    'A single collector has been filing useful, well made and simply interesting websites<br>\n' +
    'since 2009. Favour goes to sites that do one thing properly, stay online, and load\n' +
    'quickly.<br><br>\n' +
    'No advertising runs here, no cookies are set and nobody is tracked.<br>\n' +
    'Alongside the collection there is an\n' +
    '<a href="exhibition.html">exhibition hall</a>, rearranged from time to time.<br><br>\n' +
    'Contact: <a href="mailto:mail@shit.pub">mail@shit.pub</a><br>\n' +
    'Questions, corrections and sites sent in bulk are all welcome.\n' +
    '</font>\n</div>\n'
})));

/* ----------------------------------------------------------------- shop */
/* --------------------------------------------------------------- contact */
/* submissions are not taken through this site; only by discord, qq or mail */
(function () {
  var channels = [
    { label: 'discord', href: 'https://discord.com/invite/ZJemMBsm',
      text: 'discord.com/invite/ZJemMBsm', note: 'fastest way to reach the collector' },
    { label: 'qq', href: 'https://qm.qq.com/q/4nyFIEjn04',
      text: 'qm.qq.com/q/4nyFIEjn04', note: 'for bulk lists and larger submissions' },
    { label: 'email', href: 'mailto:mail@shit.pub',
      text: 'mail@shit.pub', note: 'anything else, or a single site' }
  ];

  built.push(write('contact.html', page({
    key: 'contact',
    file: 'contact.html',
    prefix: '',
    title: 'Submit a site - ' + TOTAL_TITLE,
    description: 'Submissions are taken by discord, qq or email only.',
    body:
      '<h2>Submit a site</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">There is no upload form on this\n' +
      'site. Sites are taken by <b>discord</b>, <b>qq</b> or <b>email</b>\n' +
      'only.</font></p>\n\n' +
      '<table class="formtable" width="720" cellpadding="0" cellspacing="0" border="0">\n' +
      channels.map(function (ch) {
        return '<tr><td width="110" align="right" valign="top"><font size="2">' +
          esc(ch.label) + '</font></td>\n<td valign="top"><font size="2">' +
          '<a href="' + esc(ch.href) + '">' + esc(ch.text) + '</a>' +
          '<br><span class="host">' + esc(ch.note) + '</span></font></td></tr>\n';
      }).join('') + '</table>\n\n' +
      '<hr width="720">\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'What to send:<br>\n' +
      'the address, the name, the room it belongs in, and one sentence on what it\n' +
      'is for.<br><br>\n' +
      'Bulk lists are welcome: a plain text file, a spreadsheet or a long message\n' +
      'all work.<br>\n' +
      'Nothing is added before the link has been checked by hand.\n' +
      '</font>\n</div>\n'
  })));
})();

/* ----------------------------------------------------------- exhibition hall */
(function () {
  var HANGS = [
    'The Met', 'Louvre', 'British Museum', 'Internet Archive', 'Library of Congress',
    'NASA', 'CERN', 'Nature', 'arXiv', 'GitHub', 'MDN Web Docs', 'Wikipedia',
    'Mayo Clinic', 'PubMed', 'Google Arts & Culture', 'Europeana'
  ];

  var index = {};
  SITES.forEach(function (s) { index[s.name] = s; });

  var pieces = HANGS.filter(function (n) { return index[n]; }).map(function (n) {
    return index[n];
  });

  built.push(write('exhibition.html', page({
    key: 'exhibition',
    file: 'exhibition.html',
    prefix: '',
    title: 'Exhibition hall - ' + TOTAL_TITLE,
    description: 'A changing selection hung out of storage: ' + pieces.length +
      ' highlights from the collection.',
    body:
      '<h2>Exhibition hall</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">A few pieces hung out of\n' +
      'storage for the moment. ' + pieces.length + ' exhibits, changed from time to\n' +
      'time.<br>Everything here also sits in the\n' +
      '<a href="sites.html">complete directory</a>.</font></p>\n\n' +
      '<ul class="entrylist">\n' + pieces.map(function (s) {
        return entryHtml(s, true);
      }).join('\n') + '\n</ul>\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'Questions, corrections and sites sent in bulk are all welcome.<br>\n' +
      '<a href="mailto:mail@shit.pub">mail@shit.pub</a> &middot;\n' +
      '<a href="contact.html">submit a site</a>\n' +
      '</font>\n</div>\n'
  })));
})();

/* ------------------------------------------------------------------- 404 */
/* GitHub Pages serves this file for any unknown path, including deep ones like
   /a/b/c, so every link and asset in it must be absolute. */
(function () {
  var busy = CATS.slice().sort(function (a, b) {
    return rooms[b].length - rooms[a].length;
  }).slice(0, 12);

  built.push(write('404.html', page({
    key: 'error',
    file: '404.html',
    prefix: '/',
    noindex: true,
    title: 'Room not found (404) - ' + TOTAL_TITLE,
    description: 'The page you asked for is not part of the collection.',
    body:
      '<h2>404</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">\n' +
      'This room does not exist.</font></p>\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'The piece you asked for is not in this museum.<br>\n' +
      'It may have been moved, renamed, or the address mistyped.<br><br>\n' +
      'Try the <a href="/">front door</a>, the\n' +
      '<a href="/categories.html">list of rooms</a>, or the\n' +
      '<a href="/sites.html">complete directory</a>.\n' +
      '</font>\n</div>\n\n' +
      '<h3>Busiest rooms</h3>\n\n<ul class="plainlist cols">\n' +
      busy.map(function (c) {
        return '<li><a href="/categories/' + c + '.html">' + esc(c) + '</a> (' +
          rooms[c].length + ')</li>';
      }).join('\n') + '\n</ul>\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'Questions, corrections and sites sent in bulk are all welcome.<br>\n' +
      '<a href="mailto:mail@shit.pub">mail@shit.pub</a> &middot;\n' +
      '<a href="/contact.html">submit a site</a>\n' +
      '</font>\n</div>\n'
  })));
})();

built.push(write('links.html', page({
  key: 'links',
  file: 'links.html',
  prefix: '',
  title: 'Links to other collections and forums - ' + TOTAL_TITLE,
  description: 'Other internet collections, archives and forums worth a visit.',
  body:
    '<h2>Links to other collections and forums</h2>\n\n' +
    '<p class="lead" align="center"><font size="2">Coming soon.</font></p>\n\n' +
    '<div class="message">\n<font size="2">\n' +
    'A list of kindred collections is being prepared.<br>\n' +
    'In the meantime, the <a href="categories.html">rooms</a> are open.\n' +
    '</font>\n</div>\n'
})));

built.push(write('sitemap.html', page({
  key: 'sitemap',
  file: 'sitemap.html',
  prefix: '',
  title: 'Site map - ' + TOTAL_TITLE,
  description: 'Every page in the museum, listed in one place.',
  body:
    '<h2>Site map</h2>\n\n' +
    '<ul class="plainlist">\n' +
    '<li><a href="index.html">home</a></li>\n' +
    '<li><a href="categories.html">categories</a></li>\n' +
    '<li><a href="sites.html">sites (complete directory)</a></li>\n' +
    '<li><a href="acknowledgments.html">acknowledgments</a></li>\n' +
    '<li><a href="links.html">links to other collections</a></li>\n' +
    '<li><a href="about.html">about the collector</a></li>\n' +
    '</ul>\n\n' +
    '<h3>Rooms</h3>\n\n<ul class="plainlist cols">\n' +
    CATS.map(function (c) {
      return '<li><a href="categories/' + c + '.html">' + esc(c) + '</a> (' + rooms[c].length + ')</li>';
    }).join('\n') + '\n</ul>\n'
})));

/* ----------------------------------------------------------- sitemap.xml */
(function () {
  var urls = ['', 'categories.html', 'sites.html', 'exhibition.html', 'contact.html',
    'acknowledgments.html',
    'sitemap.html', 'links.html', 'about.html'].concat(
    CATS.map(function (c) { return 'categories/' + c + '.html'; }));

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(function (u) {
      var priority = u === '' ? '1.0' : (u.indexOf('categories/') === 0 ? '0.6' : '0.8');
      return '<url>\n<loc>' + SITE + u + '</loc>\n<lastmod>2026-10-04</lastmod>\n' +
        '<changefreq>monthly</changefreq>\n<priority>' + priority + '</priority>\n</url>';
    }).join('\n') + '\n</urlset>\n';

  write('sitemap.xml', xml);
  built.push('sitemap.xml');
})();

console.log('rooms   : ' + CATS.length);
console.log('sites   : ' + SITES.length);
console.log('pages   : ' + built.length);
