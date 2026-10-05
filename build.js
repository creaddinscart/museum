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

let RELICS = [];
const relicsFile = path.join(ROOT, 'relics.js');
if (fs.existsSync(relicsFile)) {
  eval(fs.readFileSync(relicsFile, 'utf8'));
  RELICS = window.MUSEUM_RELICS || [];
}

let COUNTRIES = [];
const countriesFile = path.join(ROOT, 'countries.js');
if (fs.existsSync(countriesFile)) {
  eval(fs.readFileSync(countriesFile, 'utf8'));
  COUNTRIES = window.MUSEUM_COUNTRIES || [];
}
const BY_C3 = {};
COUNTRIES.forEach(function (c) { BY_C3[c.c3] = c; });

let PLUGS = [];
const plugsFile = path.join(ROOT, 'plugs.js');
if (fs.existsSync(plugsFile)) {
  eval(fs.readFileSync(plugsFile, 'utf8'));
  PLUGS = window.MUSEUM_PLUGS || [];
}

/* which country a site belongs to, where that can be placed with confidence.
   ISO 3166-1 alpha-3, or INT for bodies answerable to more than one state. */
var SITE_CC = {
  "12306": "CHN",
  "1Password": "CAN",
  "36Kr": "CHN",
  "51job": "CHN",
  "ACM": "USA",
  "AIA": "USA",
  "AP News": "USA",
  "ASEAN": "INT",
  "AWS": "USA",
  "Accenture": "USA",
  "Adafruit": "USA",
  "Adobe": "USA",
  "Aeon": "GBR",
  "African Union": "INT",
  "Airbnb": "USA",
  "Akamai": "USA",
  "Alfred": "GBR",
  "Alibaba": "CHN",
  "Alibaba Cloud": "CHN",
  "All About Circuits": "USA",
  "AlphaFold DB": "USA",
  "Amazon": "USA",
  "Android Developers": "USA",
  "Ansible": "USA",
  "Anthropic": "USA",
  "Aozora Bunko": "JPN",
  "Apache HTTP Server": "USA",
  "Apache Kafka": "USA",
  "Apple Developer": "USA",
  "Arduino": "ITA",
  "Arianespace": "FRA",
  "Ars Technica": "USA",
  "ArtStation": "USA",
  "Artsy": "USA",
  "Asana": "USA",
  "Ask Ubuntu": "USA",
  "Atlassian": "AUS",
  "Azure": "USA",
  "BBC": "GBR",
  "BCG": "USA",
  "BIS": "INT",
  "Bain": "USA",
  "Bandcamp": "USA",
  "Behance": "USA",
  "Best Buy": "USA",
  "Bilibili": "CHN",
  "Bitbucket": "USA",
  "Bitwarden": "USA",
  "Bloomberg": "USA",
  "Blue Origin": "USA",
  "Bluesky": "USA",
  "Booking.com": "NLD",
  "Bootstrap": "USA",
  "Boss Zhipin": "CHN",
  "Brilliant": "USA",
  "Britannica": "USA",
  "British Museum": "GBR",
  "Bun": "USA",
  "CDC": "USA",
  "CERN": "CHE",
  "CISA": "USA",
  "CME Group": "USA",
  "CMake": "USA",
  "CNN": "USA",
  "CNRS": "FRA",
  "CNSA": "CHN",
  "CVE": "USA",
  "Caddy": "USA",
  "Caixin": "CHN",
  "Cambridge University": "GBR",
  "Can I use": "USA",
  "Canva": "AUS",
  "Carbon Design System": "USA",
  "Centre Pompidou": "FRA",
  "ChatGPT": "USA",
  "CircleCI": "USA",
  "Claude": "USA",
  "Cleveland Clinic": "USA",
  "Cloudflare": "USA",
  "Cochrane": "GBR",
  "Codeberg": "DEU",
  "CoinDesk": "USA",
  "Coinbase": "USA",
  "Copernicus": "INT",
  "Cornell LII": "USA",
  "Coursera": "USA",
  "CourtListener": "USA",
  "Crossref": "USA",
  "Crunchbase": "USA",
  "DEV Community": "USA",
  "Databricks": "USA",
  "Datadog": "USA",
  "DeepL": "DEU",
  "DeepMind": "GBR",
  "Deno": "USA",
  "Der Spiegel": "DEU",
  "Deutsches Museum": "DEU",
  "DeviantArt": "USA",
  "Dice": "USA",
  "DigiKey": "USA",
  "Digital Public Library of America": "USA",
  "DigitalOcean": "USA",
  "Discogs": "USA",
  "Discord": "USA",
  "Divisare": "ITA",
  "Docker": "USA",
  "Domus": "ITA",
  "Dribbble": "USA",
  "Duden": "DEU",
  "Duolingo": "USA",
  "ECB": "INT",
  "ECMA International": "CHE",
  "ECMWF": "INT",
  "EEVBlog": "AUS",
  "ESA": "INT",
  "El Pais": "ESP",
  "Elasticsearch": "USA",
  "Electronic Frontier Foundation": "USA",
  "Etsy": "USA",
  "European Union": "INT",
  "Europeana": "INT",
  "Expedia": "USA",
  "Exploit Database": "USA",
  "Fastly": "USA",
  "Fermilab": "USA",
  "Figma": "USA",
  "Financial Times": "GBR",
  "Firebase": "USA",
  "First Round Review": "USA",
  "Fiverr": "ISR",
  "Flightradar24": "SWE",
  "Fly.io": "USA",
  "Font Awesome": "USA",
  "Forbes": "USA",
  "Forvo": "ESP",
  "Free Music Archive": "USA",
  "GCC": "USA",
  "GNU Emacs": "USA",
  "Gallica": "FRA",
  "Getty Museum": "USA",
  "Git": "USA",
  "GitHub": "USA",
  "GitHub Actions": "USA",
  "GitHub Copilot": "USA",
  "GitLab": "USA",
  "Glassdoor": "USA",
  "Go": "USA",
  "Godly": "USA",
  "Google AI": "USA",
  "Google Arts & Culture": "USA",
  "Google Cloud": "USA",
  "Google Developers": "USA",
  "Google Fonts": "USA",
  "Google Gemini": "USA",
  "Google Scholar": "USA",
  "Google Translate": "USA",
  "GovInfo": "USA",
  "Grafana": "USA",
  "Guggenheim": "USA",
  "HKEX": "HKG",
  "Hackaday": "USA",
  "Hacker News": "USA",
  "HackerRank": "USA",
  "Hackster": "USA",
  "Harvard Business Review": "USA",
  "Harvard University": "USA",
  "Have I Been Pwned": "USA",
  "Heavens-Above": "USA",
  "Hermitage": "RUS",
  "Hetzner": "DEU",
  "Httpster": "USA",
  "Huawei Cloud": "CHN",
  "Hugging Face": "USA",
  "IBM": "USA",
  "ICC": "INT",
  "ICourse163": "CHN",
  "IEEE": "USA",
  "IEEE Spectrum": "USA",
  "IETF": "INT",
  "IMDb": "USA",
  "IMF": "INT",
  "ISO": "CHE",
  "ISRO": "IND",
  "ITER": "CHE",
  "InVision": "USA",
  "Indeed": "USA",
  "Internet Archive": "USA",
  "Interpol": "INT",
  "JAXA": "JPN",
  "JD.com": "CHN",
  "JSTOR": "USA",
  "James Webb Space Telescope": "USA",
  "Japan Exchange Group": "JPN",
  "Jenkins": "USA",
  "JetBrains": "DEU",
  "Jisho": "JPN",
  "Jupyter": "USA",
  "Justia": "USA",
  "Kaggle": "USA",
  "KeePassXC": "USA",
  "Khan Academy": "USA",
  "Kotlin": "USA",
  "Krebs on Security": "USA",
  "Kubernetes": "USA",
  "LIGO": "USA",
  "LLVM": "USA",
  "LangChain": "USA",
  "Last.fm": "GBR",
  "Le Monde": "FRA",
  "LeetCode": "USA",
  "Let's Encrypt": "USA",
  "Letterboxd": "NZL",
  "Library of Congress": "USA",
  "Liepin": "CHN",
  "LinkedIn": "USA",
  "LlamaIndex": "USA",
  "Lobsters": "USA",
  "Louvre": "FRA",
  "MATLAB": "USA",
  "MDN Web Docs": "USA",
  "MIT": "USA",
  "MIT OpenCourseWare": "USA",
  "MIT Technology Review": "USA",
  "MITRE ATT&CK": "USA",
  "MarineTraffic": "GRC",
  "Mastodon": "DEU",
  "Material Design": "USA",
  "Max Planck Society": "DEU",
  "Mayo Clinic": "USA",
  "McKinsey": "USA",
  "Medium": "USA",
  "Memrise": "GBR",
  "Mercado Libre": "MEX",
  "Merriam-Webster": "USA",
  "Met Office": "GBR",
  "Meta AI": "USA",
  "Metacritic": "USA",
  "Metafilter": "USA",
  "Metasploit": "USA",
  "Microsoft Learn": "USA",
  "Mistral AI": "FRA",
  "MoMA": "USA",
  "MongoDB": "USA",
  "Mouser": "USA",
  "Musopen": "USA",
  "Muzli": "USA",
  "MySQL": "USA",
  "NASA": "USA",
  "NASA ADS": "USA",
  "NATO": "INT",
  "NEJM": "USA",
  "NHK World": "JPN",
  "NIH": "USA",
  "NOAA": "USA",
  "NPR": "USA",
  "NVD": "USA",
  "NVIDIA Developer": "USA",
  "NYSE": "USA",
  "Nasdaq": "USA",
  "National Bureau of Statistics of China": "CHN",
  "National Gallery of Art": "USA",
  "National Geographic": "USA",
  "National Museum of China": "CHN",
  "Nature": "GBR",
  "Nautilus": "USA",
  "Netlify": "USA",
  "Next.js": "USA",
  "Nginx": "USA",
  "Nielsen Norman Group": "USA",
  "Node.js": "USA",
  "Notion": "USA",
  "NuGet": "USA",
  "OECD": "INT",
  "ONNX": "USA",
  "ORCID": "USA",
  "OVHcloud": "FRA",
  "OWASP": "INT",
  "Obsidian": "USA",
  "One Page Love": "USA",
  "OpenAI": "USA",
  "OpenAlex": "USA",
  "OpenCV": "USA",
  "OpenStax": "USA",
  "Openverse": "USA",
  "Oracle": "USA",
  "Overleaf": "GBR",
  "Oxford University": "GBR",
  "PBS": "USA",
  "PKULaw": "CHN",
  "PLOS": "USA",
  "PNAS": "USA",
  "Packagist": "USA",
  "Palace Museum": "CHN",
  "People's Bank of China": "CHN",
  "Perplexity": "USA",
  "Pexels": "DEU",
  "Pinterest": "USA",
  "Planet Labs": "USA",
  "PortSwigger": "GBR",
  "Prado": "ESP",
  "Privacy Guides": "USA",
  "Product Hunt": "USA",
  "Prometheus": "USA",
  "PubMed": "USA",
  "PyPI": "USA",
  "PyTorch": "USA",
  "Python": "USA",
  "Quanta Magazine": "USA",
  "Quizlet": "USA",
  "Quora": "USA",
  "RCSB Protein Data Bank": "USA",
  "RFC Editor": "USA",
  "RIBA": "GBR",
  "RabbitMQ": "USA",
  "Radix UI": "USA",
  "Rakuten": "JPN",
  "Raspberry Pi": "GBR",
  "React": "USA",
  "Red Hat": "USA",
  "Reddit": "USA",
  "Redis": "USA",
  "Remote OK": "USA",
  "ResearchGate": "DEU",
  "Reuters": "GBR",
  "Reverso Context": "FRA",
  "Rijksmuseum": "NLD",
  "Rocket Lab": "USA",
  "Rome2rio": "AUS",
  "Roscosmos": "RUS",
  "Rotten Tomatoes": "USA",
  "Royal Society": "GBR",
  "RubyGems": "USA",
  "Rust": "USA",
  "SANS Institute": "USA",
  "SAP": "DEU",
  "SETI Institute": "USA",
  "SLAC": "USA",
  "SSL Labs": "USA",
  "Saatchi Art": "USA",
  "Salesforce": "USA",
  "Schneier on Security": "USA",
  "Science": "USA",
  "Semantic Scholar": "USA",
  "Sentry": "USA",
  "Sequoia Capital": "USA",
  "Server Fault": "USA",
  "ServiceNow": "USA",
  "Shanghai Museum": "CHN",
  "Shanghai Stock Exchange": "CHN",
  "Shenzhen Stock Exchange": "CHN",
  "Shodan": "USA",
  "Shopify": "CAN",
  "SiteInspire": "USA",
  "Sketch": "NLD",
  "Skyscanner": "GBR",
  "Slack": "USA",
  "Smashing Magazine": "DEU",
  "Smithsonian": "USA",
  "Snowflake": "USA",
  "SoundCloud": "DEU",
  "SpaceX": "USA",
  "SparkFun": "USA",
  "Stack Exchange": "USA",
  "Stack Overflow": "USA",
  "Stanford University": "USA",
  "Stellarium Web": "USA",
  "Substack": "USA",
  "Supabase": "USA",
  "Swift": "USA",
  "TED": "USA",
  "Tailwind CSS": "USA",
  "Tandem": "DEU",
  "Taobao": "CHN",
  "Tate": "GBR",
  "TechCrunch": "USA",
  "Tencent Cloud": "CHN",
  "TensorFlow": "USA",
  "Terraform": "USA",
  "The Guardian": "GBR",
  "The Lancet": "GBR",
  "The Met": "USA",
  "The New York Times": "USA",
  "The Odin Project": "USA",
  "The Verge": "USA",
  "Todoist": "USA",
  "Tokyo National Museum": "JPN",
  "Tor Project": "USA",
  "Trello": "USA",
  "Trip.com": "CHN",
  "Tripadvisor": "USA",
  "Trove": "AUS",
  "TypeScript": "USA",
  "UN": "INT",
  "UN Comtrade": "INT",
  "UNESCO": "INT",
  "UNESCO World Heritage Centre": "INT",
  "UNHCR": "INT",
  "UNICEF": "INT",
  "US National Archives": "USA",
  "US Supreme Court": "USA",
  "USGS": "USA",
  "Uber": "USA",
  "Udacity": "USA",
  "Udemy": "USA",
  "Uffizi": "ITA",
  "Unicode Consortium": "USA",
  "Unpaywall": "USA",
  "Unsplash": "CAN",
  "Upwork": "USA",
  "V2EX": "CHN",
  "VMware": "USA",
  "VS Code": "USA",
  "Van Gogh Museum": "NLD",
  "Vercel": "USA",
  "Vim": "USA",
  "Vimeo": "USA",
  "VirusTotal": "ESP",
  "W3C": "INT",
  "WHATWG": "USA",
  "WHO": "INT",
  "WIPO": "CHE",
  "WTO": "INT",
  "Wall Street Journal": "USA",
  "Walmart": "USA",
  "Weights & Biases": "USA",
  "Wellfound": "USA",
  "Wikidata": "USA",
  "Wikipedia": "USA",
  "Wired": "USA",
  "Wolfram Alpha": "USA",
  "WooCommerce": "USA",
  "Workday": "USA",
  "World Bank": "INT",
  "World Food Programme": "INT",
  "XuetangX": "CHN",
  "Y Combinator": "USA",
  "Zenodo": "CHE",
  "Zhaopin": "CHN",
  "Zoho": "IND",
  "Zoom": "USA",
  "Zotero": "USA",
  "a16z": "USA",
  "arXiv": "USA",
  "eBay": "USA",
  "eLife": "GBR",
  "edX": "USA",
  "freeCodeCamp": "USA",
  "iNaturalist": "USA",
  "jQuery": "USA",
  "levels.fyi": "USA",
  "npm": "USA",
  "spaCy": "DEU"
};

/* moving image: official channels of real museums, verified reachable */
const VIDEOS = [
  { label: 'British Museum', url: 'https://www.youtube.com/@britishmuseum', note: 'object films and curators talking' },
  { label: 'Louvre', url: 'https://www.youtube.com/@MuseeLouvre', note: 'gallery tours and restoration work' },
  { label: 'The Met', url: 'https://www.youtube.com/@metmuseum', note: 'exhibition walkthroughs, in depth' },
  { label: 'Smithsonian', url: 'https://www.youtube.com/@smithsonian', note: 'air and space, natural history, more' },
  { label: 'Digital Dunhuang', url: 'https://www.e-dunhuang.com', note: 'panoramic caves, no ticket needed' },
  { label: 'Palace Museum Digital', url: 'https://digicol.dpm.org.cn', note: 'hundreds of thousands of objects catalogued' },
  { label: 'Wikimedia Commons', url: 'https://commons.wikimedia.org', note: 'the source of every picture on this page' }
];

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
  { key: 'countries', file: 'countries.html', label: 'countries' },
  { key: 'live', file: 'live.html', label: 'live' },
  { key: 'plugs', file: 'plugs.html', label: 'plugs' },
  { key: 'gallery', file: 'gallery.html', label: 'photos & video' },
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
    (opts.key === 'home' || opts.key === 'live'
      ? '<script src="' + prefix + 'picks.js"></script>\n' : '') +
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
    '<h3>Out of storage</h3>\n\n' +
    '<p class="lead" align="center"><font size="2">Three pieces drawn at\n' +
    'random. Reload the page for different ones.</font></p>\n\n' +
    '<div class="livebox" data-live="random">\n' +
    '<font size="2" color="#808080">A random piece appears here when\n' +
    'scripting is available.</font>\n</div>\n\n' +
    '<div class="message" align="center">\n' +
    '<font size="2">\n' +
    SITES.length + ' real sites &middot; ' + CATS.length + ' rooms &middot; ' +
    COUNTRIES.length + ' countries &middot; ' + RELICS.length + ' objects<br>\n' +
    '<a href="categories.html">browse the rooms</a> &middot;\n' +
    '<a href="sites.html">the complete directory</a> &middot;\n' +
    '<a href="countries.html">every country</a> &middot;\n' +
    '<a href="gallery.html">photos &amp; video</a> &middot;\n' +
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

/* ---------------------------------------------------------------- gallery */
(function () {
  var pieces = RELICS.map(function (r) {
    var where = r.site
      ? '<a class="ext" href="' + esc(r.site) + '" rel="noopener noreferrer">' +
        esc(r.museum) + '</a>'
      : esc(r.museum);

    return '<figure class="piece">' +
      '<a href="' + esc(r.source) + '" rel="noopener noreferrer">' +
        '<img src="' + esc(r.file) + '" alt="' + esc(r.name) + '" width="960" loading="lazy">' +
      '</a>' +
      '<figcaption>' +
        '<b>' + esc(r.name) + '</b>' +
        (r.copy ? ' <span class="chip">replica or copy</span>' : '') + '<br>' +
        '<span class="host">' + where + ', ' + esc(r.place) + '</span><br>' +
        '<span class="host">' + esc(r.period) + '</span><br>' +
        (r.note ? '<span class="snip">' + esc(r.note) + '</span><br>' : '') +
        '<span class="credit">' + esc(r.credit) + ' &middot; ' + esc(r.license) +
        ' &middot; <a href="' + esc(r.source) + '" rel="noopener noreferrer">source</a></span>' +
      '</figcaption>' +
    '</figure>';
  }).join('\n');

  built.push(write('gallery.html', page({
    key: 'gallery',
    file: 'gallery.html',
    prefix: '',
    title: 'Photos and video - ' + TOTAL_TITLE,
    description: 'Photographs of real objects held by real museums, with attribution, plus the moving image collections worth visiting.',
    body:
      '<h2>Photos &amp; video</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">Objects held by real museums,\n' +
      'photographed in the room and online. ' + RELICS.length + ' pieces below: each one\n' +
      'credited, linked to its source, and carrying the address of the museum that\n' +
      'keeps it.<br>Pictures are stored on this site rather than hotlinked, so nothing\n' +
      'here breaks when somebody else moves a file.</font></p>\n\n' +
      '<div class="gallery">\n' + pieces + '\n</div>\n\n' +
      '<hr width="720">\n\n' +
      '<h3>Moving image</h3>\n\n' +
      '<p class="lead" align="center"><font size="2">The museums themselves run the\n' +
      'best footage. These are their own channels and collections.</font></p>\n\n' +
      '<ul class="entrylist">\n' + VIDEOS.map(function (v) {
        return '<li><a class="ext" href="' + esc(v.url) + '" rel="noopener noreferrer">' +
          esc(v.label) + '</a><span class="snip">' + esc(v.note) + '</span></li>';
      }).join('\n') + '\n</ul>\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'Every photograph on this page comes from Wikimedia Commons and is shown under\n' +
      'its original licence, named under each image.<br>\n' +
      'A few are photographs of replicas rather than the original object; those are\n' +
      'marked <span class="chip">replica or copy</span> rather than passed off as the\n' +
      'thing itself.<br>\n' +
      'Objects belong to the museums that hold them, and this page claims nothing\n' +
      'beyond showing them.<br><br>\n' +
      'Questions, corrections and sites sent in bulk are all welcome:\n' +
      '<a href="mailto:mail@shit.pub">mail@shit.pub</a>.\n' +
      '</font>\n</div>\n'
  })));
})();

/* ------------------------------------------------------------- countries */
(function () {
  if (!COUNTRIES.length) return;

  function commas(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function wiki(host, n) {
    return 'https://' + host + '/wiki/' + encodeURIComponent(n.replace(/ /g, '_'));
  }

  function dirLat(v, pos, neg) {
    return Math.abs(v).toFixed(2) + '&deg; ' + (v >= 0 ? pos : neg);
  }

  function money(v) {
    if (!v) return '&mdash;';
    if (v >= 1e12) return '$' + (v / 1e12).toFixed(2) + ' trillion';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + ' billion';
    if (v >= 1e6) return '$' + commas(Math.round(v / 1e6)) + ' million';
    return '$' + commas(v);
  }

  /* which sites and objects belong to which country */
  var byCountry = {};
  SITES.forEach(function (s) {
    var cc = SITE_CC[s.name];
    if (!cc || cc === 'INT') return;
    (byCountry[cc] = byCountry[cc] || []).push(s);
  });

  var byRelic = {};
  RELICS.forEach(function (r) {
    if (!r.cc || r.cc === 'INT') return;
    (byRelic[r.cc] = byRelic[r.cc] || []).push(r);
  });

  /* ------------------------------------------------------- index by region */
  var regions = [];
  var regMap = {};
  COUNTRIES.forEach(function (c) {
    var r = c.reg || 'Other';
    if (!regMap[r]) { regMap[r] = []; regions.push(r); }
    regMap[r].push(c);
  });
  regions.sort();

  var jump = regions.map(function (r) {
    return '<a href="#reg-' + r.toLowerCase().replace(/[^a-z]+/g, '-') + '">' + esc(r) + '</a>';
  }).join(' &middot; ');

  var idx = regions.map(function (r) {
    var list = regMap[r].slice().sort(function (a, b) { return a.n.localeCompare(b.n); });
    return '<h3 id="reg-' + r.toLowerCase().replace(/[^a-z]+/g, '-') + '">' + esc(r) + '</h3>\n' +
      '<p class="lead"><font size="2">' + list.length + ' entries.</font></p>\n' +
      '<ul class="plainlist cols">\n' + list.map(function (c) {
        var n = byCountry[c.c3] ? byCountry[c.c3].length : 0;
        return '<li>' + (c.flag ? esc(c.flag) + ' ' : '') +
          '<a href="countries/' + c.slug + '.html">' + esc(c.n) + '</a>' +
          (n ? '<font size="2" color="#808080"> (' + n + ')</font>' : '') + '</li>';
      }).join('\n') + '\n</ul>\n';
  }).join('\n');

  built.push(write('countries.html', page({
    key: 'countries',
    file: 'countries.html',
    prefix: '',
    title: 'Countries - ' + TOTAL_TITLE,
    description: 'Every country and territory in the world: ' + COUNTRIES.length +
      ' pages of facts, maps and the parts of the collection filed under each one.',
    body:
      '<h2>Countries</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">' + COUNTRIES.length +
      ' countries and territories, each with its own page:\n' +
      'capital, population, area, languages, currency, neighbours and\n' +
      'maps, followed by whatever the museum holds from that\n' +
      'country.</font></p>\n\n' +
      '<div class="filterbox" align="center">\n' +
      '<font size="2"><label for="filter">filter this page</label>\n' +
      '<input id="filter" type="search" size="28" autocomplete="off" spellcheck="false">\n' +
      '<span id="filterCount" class="tally"></span></font>\n</div>\n\n' +
      '<p class="jump"><font size="2">' + jump + '</font></p>\n\n' + idx + '\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'Numbers come from a public country dataset (CC0) and are shown as\n' +
      'supplied: they move, and no page here is an authority on\n' +
      'borders.<br>\n' +
      'The count after each name is how many sites in the\n' +
      '<a href="sites.html">collection</a> belong to that country.\n' +
      '</font>\n</div>\n'
  })));

  /* ------------------------------------------------------ one page each */
  function factRow(k, v) {
    return '<tr><td width="190" align="right" valign="top"><font size="2">' +
      esc(k) + '</font></td>\n<td valign="top"><font size="2">' + v + '</font></td></tr>\n';
  }

  COUNTRIES.forEach(function (c, i) {
    var prev = i > 0 ? COUNTRIES[i - 1] : null;
    var next = i < COUNTRIES.length - 1 ? COUNTRIES[i + 1] : null;

    var pager = '<table class="pager" width="720" cellpadding="0" cellspacing="0" border="0">\n<tr>\n' +
      '<td align="left"><font size="2">' +
      (prev ? '<a href="' + prev.slug + '.html">&larr; ' + esc(prev.n) + '</a>' : '&nbsp;') +
      '</font></td>\n' +
      '<td align="center"><font size="2"><a href="../countries.html">all countries</a></font></td>\n' +
      '<td align="right"><font size="2">' +
      (next ? '<a href="' + next.slug + '.html">' + esc(next.n) + ' &rarr;</a>' : '&nbsp;') +
      '</font></td>\n' +
      '</tr>\n</table>\n';

    var borders = (c.borders || []).map(function (b) {
      var o = BY_C3[b];
      return o ? '<a href="' + o.slug + '.html">' + esc(o.n) + '</a>' : esc(b);
    }).join(', ');

    var facts =
      factRow('official name', esc(c.o)) +
      factRow('capital', c.cap ? esc(c.cap) : '&mdash;') +
      factRow('population', c.pop ? commas(c.pop) : '&mdash;') +
      factRow('area', c.area ? commas(c.area) + ' km&sup2;' : '&mdash;') +
      factRow('economy', money(c.gdp)) +
      factRow('life expectancy', c.life ? c.life + ' years' : '&mdash;') +
      factRow('region', esc([c.reg, c.sub].filter(Boolean).join(' / ')) || '&mdash;') +
      factRow('languages', (c.langs && c.langs.length) ? esc(c.langs.join(', ')) : '&mdash;') +
      factRow('currency', (c.cur && c.cur.length) ? esc(c.cur.join(', ')) : '&mdash;') +
      factRow('calling code', c.idd ? esc(c.idd) : '&mdash;') +
      factRow('internet domain', (c.tld && c.tld.length) ? esc(c.tld.join(' ')) : '&mdash;') +
      factRow('mains power', (c.plug && c.plug.length)
        ? '<b>' + c.plug.map(function (p) {
            return '<a href="../plugs.html#plug-' + esc(p) + '">' + esc(p) + '</a>';
          }).join(', ') + '</b>' +
          (c.volt ? ', ' + esc(c.volt) : '') + (c.hz ? ', ' + esc(c.hz) : '')
        : 'not recorded') +
      factRow('drives on', c.side
        ? (c.side === 'LHT' ? 'the left' : 'the right') +
          ' <span class="host">(' + esc(c.side) + ')</span>'
        : '&mdash;') +
      factRow('time zones', (c.tz && c.tz.length)
        ? esc(c.tz.slice(0, 4).join(', ')) + (c.tz.length > 4
          ? ' <font color="#808080">and ' + (c.tz.length - 4) + ' more</font>' : '')
        : '&mdash;') +
      factRow('neighbours', borders || 'none (island or enclave)') +
      factRow('position', (c.lat !== null && c.lng !== null)
        ? dirLat(c.lat, 'N', 'S') + ', ' + dirLat(c.lng, 'E', 'W') : '&mdash;') +
      factRow('status', [c.un ? 'UN member' : 'not a UN member',
        c.ind ? '' : 'not independent', c.ll ? 'landlocked' : '']
        .filter(Boolean).join(', ') || '&mdash;');

    var maps = (c.lat !== null && c.lng !== null)
      ? '<li><a class="ext" href="https://www.openstreetmap.org/?mlat=' + c.lat +
        '&amp;mlon=' + c.lng + '#map=5/' + c.lat + '/' + c.lng +
        '" rel="noopener noreferrer">OpenStreetMap</a></li>\n' +
        '<li><a class="ext" href="https://www.google.com/maps/@' + c.lat + ',' + c.lng +
        ',6z" rel="noopener noreferrer">Google Maps</a></li>\n'
      : '';

    var links = '<ul class="plainlist">\n' +
      '<li><a class="ext" href="' + wiki('en.wikipedia.org', c.n) + '" rel="noopener noreferrer">Wikipedia</a></li>\n' +
      '<li><a class="ext" href="' + wiki('en.wikivoyage.org', c.n) + '" rel="noopener noreferrer">Wikivoyage</a></li>\n' +
      maps +
      '</ul>\n';

    var mine = byCountry[c.c3] || [];
    var holds = byRelic[c.c3] || [];

    var sitesBlock = mine.length
      ? '<ul class="entrylist">\n' + mine.map(function (s) {
          return entryHtml(s, true);
        }).join('\n') + '\n</ul>\n'
      : '<p class="lead"><font size="2">Nothing in the collection carries this\n' +
        'country yet. <a href="../contact.html">Send something in</a> and it\n' +
        'will be filed here.</font></p>\n';

    var relicBlock = holds.length
      ? '<ul class="entrylist">\n' + holds.map(function (r) {
          return '<li><a class="ext" href="' + esc(r.source) +
            '" rel="noopener noreferrer">' + esc(r.name) + '</a>' +
            '<span class="host">' + esc(r.museum) + ', ' + esc(r.place) + '</span>' +
            '<span class="snip">' + esc(r.note) + '</span></li>';
        }).join('\n') + '\n</ul>\n'
      : '';

    built.push(write('countries/' + c.slug + '.html', page({
      key: 'countries',
      file: 'countries/' + c.slug + '.html',
      prefix: '../',
      title: c.n + ' - ' + TOTAL_TITLE,
      description: c.n + ': capital, population, area, languages, currency, neighbours and maps, plus ' +
        mine.length + ' sites from the collection filed under this country.',
      body:
        '<h2>' + (c.flag ? esc(c.flag) + ' ' : '') + esc(c.n) + '</h2>\n\n' +
        '<p class="lead" align="center"><font size="2">' +
        esc([c.sub, c.reg].filter(Boolean).join(', ') || c.cont || '') +
        (c.cap ? ' &middot; capital ' + esc(c.cap) : '') +
        (c.pop ? ' &middot; ' + commas(c.pop) + ' people' : '') +
        '</font></p>\n\n' +
        pager + '\n\n' +
        '<h3>Facts</h3>\n\n' +
        '<table class="formtable" width="720" cellpadding="0" cellspacing="0" border="0">\n' +
        facts + '</table>\n\n' +
        '<h3>Elsewhere</h3>\n\n' + links + '\n' +
        '<h3>In this collection (' + mine.length + ')</h3>\n\n' + sitesBlock + '\n' +
        (holds.length ? '<h3>Objects kept here (' + holds.length + ')</h3>\n\n' + relicBlock + '\n' : '') +
        '<div class="message">\n<font size="2">\n' +
        'Figures are taken from a public country dataset (CC0) and are shown as\n' +
        'supplied.<br>\n' +
        'Questions, corrections and sites sent in bulk are all welcome:\n' +
        '<a href="mailto:mail@shit.pub">mail@shit.pub</a> &middot;\n' +
        '<a href="../contact.html">submit a site</a>\n' +
        '</font>\n</div>\n\n' + pager
    })));
  });
})();

/* ------------------------------------------------------------------ live */
/* A page that reads public, key-free APIs straight from the browser, so the
   numbers move without a server. Each block has a static fallback: with
   scripting off the page still reads as a plain list of sources. */
(function () {
  var PANELS = [
    { id: 'crypto', title: 'Money &mdash; crypto', note: 'Prices from CoinGecko, refreshed every minute.' },
    { id: 'fx', title: 'Money &mdash; currencies', note: 'Reference rates from Frankfurter (European Central Bank).' },
    { id: 'fear', title: 'Money &mdash; mood', note: 'Fear and greed index for crypto, from alternative.me.' },
    { id: 'tech', title: 'Technology', note: 'Top stories on Hacker News right now.' },
    { id: 'quakes', title: 'Earth', note: 'Significant earthquakes in the last week, from the USGS feed.' },
    { id: 'space', title: 'Space', note: 'Where the space station is, and NASA\'s picture of the day.' },
    { id: 'weather', title: 'Weather', note: 'Current conditions in a few capitals, from Open-Meteo.' },
    { id: 'picks', title: 'Out of storage', note: 'Three pieces drawn at random from the collection. Reload for different ones.' }
  ];

  var body = '<h2>Live</h2>\n\n' +
    '<p class="lead" align="center"><font size="2">Figures read straight from\n' +
    'public sources, in your browser, every minute on the minute. Nothing is\n' +
    'stored and nothing passes through this site.<br>' +
    'Last updated <b id="liveStamp">on load</b>. ' +
    '<span id="liveTick" class="tally"></span></font></p>\n\n' +
    '<div class="message">\n<font size="2">\n' +
    'This page needs scripting and a network connection. The rest of the\n' +
    'museum does not: everything else here is plain files.\n' +
    '</font>\n</div>\n\n';

  PANELS.forEach(function (p) {
    body += '<h3 id="live-' + p.id + '">' + p.title + '</h3>\n\n' +
      '<p class="lead"><font size="2">' + p.note + '</font></p>\n\n' +
      '<div class="livebox" data-live="' + p.id + '">\n' +
      '<font size="2" color="#808080">Waiting for ' + esc(p.id) + '. ' +
      'If nothing arrives, the source is refusing the request.</font>\n</div>\n\n';
  });

  body += '<div class="message">\n<font size="2">\n' +
    'Sources: CoinGecko, Frankfurter, Alternative.me, Hacker News, the USGS\n' +
    'earthquake feed, Open-Meteo, Where the ISS at, and NASA APOD.<br>\n' +
    'Numbers are shown as supplied and are not advice of any kind.\n' +
    '</font>\n</div>\n';

  built.push(write('live.html', page({
    key: 'live',
    file: 'live.html',
    prefix: '',
    title: 'Live - ' + TOTAL_TITLE,
    description: 'Live figures for money, technology, earth, space and weather, read from public sources every minute.',
    body: body
  })));
})();

/* --------------------------------------------------- picks for the front page */
/* A compact index of the collection, used only to draw a random piece on each
   visit. Kept separate so the front page stays light. */
(function () {
  var sites = SITES.map(function (s) {
    return { n: s.name, u: s.url, c: s.cat, d: s.desc };
  });
  var relics = RELICS.map(function (r) {
    return { n: r.name, u: r.source, m: r.museum, p: r.place, d: r.note, f: r.file };
  });
  var txt = '/* picks.js - generated by build.js. Used to draw a random piece\n' +
    '   from the collection on each visit. Do not edit by hand. */\n' +
    'window.MUSEUM_PICKS = ' + JSON.stringify({ sites: sites, relics: relics }, null, 0) + ';\n';
  write('picks.js', txt);
  built.push('picks.js');
})();

/* ------------------------------------------------------------------ plugs */
/* The reason this museum looks the way it does: a page for the plugs and
   sockets themselves, with every country that uses each type. */
(function () {
  if (!PLUGS.length) return;

  var users = {};
  COUNTRIES.forEach(function (c) {
    (c.plug || []).forEach(function (p) {
      (users[p] = users[p] || []).push(c);
    });
  });

  var pieces = PLUGS.map(function (p) {
    var list = (users[p.letter] || []).slice().sort(function (a, b) {
      return a.n.localeCompare(b.n);
    });

    var who = list.slice(0, 24).map(function (c) {
      return '<a href="countries/' + c.slug + '.html">' + esc(c.n) + '</a>';
    }).join(', ') + (list.length > 24
      ? ' <span class="host">and ' + (list.length - 24) + ' more</span>' : '');

    return '<div class="plugrow" id="plug-' + p.letter + '">' +
      '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td width="200" valign="top">' +
      (p.file ? '<a href="' + esc(p.source) + '" rel="noopener noreferrer">' +
        '<img src="' + esc(p.file) + '" alt="type ' + esc(p.letter) + ' plug" loading="lazy"></a>' +
        (p.credit ? '<br><span class="credit">' + esc(p.credit) + ' &middot; ' +
          esc(p.license) + '</span>' : '') : '') +
      '</td>' +
      '<td valign="top">' +
      '<b>Type ' + esc(p.letter) + '</b> &mdash; ' + esc(p.name) +
      ' <span class="host">' + list.length + ' countries</span><br>' +
      '<span class="snip">' + esc(p.desc) + '</span><br>' +
      '<span class="host">' + esc(p.where) + '</span><br>' +
      '<span class="snip">' + (who || 'not recorded anywhere') + '</span>' +
      '</td></tr></table>' +
      '</div>';
  }).join('\n');

  built.push(write('plugs.html', page({
    key: 'plugs',
    file: 'plugs.html',
    prefix: '',
    title: 'Plugs and sockets - ' + TOTAL_TITLE,
    description: 'The fifteen plug and socket types in use around the world, with the countries that use each one.',
    body:
      '<h2>Plugs &amp; sockets</h2>\n\n' +
      '<p class="lead" align="center"><font size="2">Fifteen types, A to\n' +
      'O, and every country that uses each one. This is the collection the\n' +
      'museum was modelled on: another museum of plugs and sockets, kept\n' +
      'elsewhere on the internet for a very long time.</font></p>\n\n' +
      '<div class="plugs">\n' + pieces + '\n</div>\n\n' +
      '<div class="message">\n<font size="2">\n' +
      'Plug types follow the IEC lettering; a country often accepts more than\n' +
      'one and sockets in older buildings may differ from the national\n' +
      'standard.<br>\n' +
      'Photographs come from Wikimedia Commons and are credited under each\n' +
      'image.\n' +
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
    '<li><a href="countries.html">countries (' + COUNTRIES.length + ' pages)</a></li>\n' +
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
  var urls = ['', 'categories.html', 'sites.html', 'exhibition.html', 'gallery.html',
    'contact.html', 'countries.html', 'live.html', 'plugs.html',
    'acknowledgments.html',
    'sitemap.html', 'links.html', 'about.html'].concat(
    CATS.map(function (c) { return 'categories/' + c + '.html'; })).concat(
    COUNTRIES.map(function (c) { return 'countries/' + c.slug + '.html'; }));

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
