#!/usr/bin/env python3

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

RULES = {
    "https://www.nasa.gov": "data-05-life.js",
    "https://www.esa.int": "data-05-life.js",
    "https://www.who.int": "data-05-life.js",
    "https://www.iucnredlist.org": "data-05-life.js",
    "https://www.semanticscholar.org": "data-05-life.js",
    "https://core.ac.uk": "data-05-life.js",
    "https://pubmed.ncbi.nlm.nih.gov": "data-01-culture.js",
    "https://www.zooniverse.org": "data-01-culture.js",
    "https://ocw.mit.edu": "data-01-culture.js",
    "https://archive.org": "data-01-culture.js",
    "https://www.freecodecamp.org": "data-03-dev.js",
    "https://www.theodinproject.com": "data-03-dev.js",
    "https://www.wolframalpha.com": "data-03-dev.js",
    "https://data.worldbank.org": "data-03-dev.js",
    "https://www.stats.gov.cn": "data-03-dev.js",
    "https://ourworldindata.org": "data-03-dev.js",
    "https://ec.europa.eu/eurostat": "data-03-dev.js",
    "https://www.openstreetmap.org": "data-03-dev.js#opendata",
    "https://fred.stlouisfed.org": "data-04-money.js#finance",
    "https://www.caixin.com": "data-04-money.js#news",
    "https://www.bbc.com": "data-04-money.js#news",
    "https://www.rijksmuseum.nl": "data-01-culture.js#heritage",
    "https://www.europeana.eu": "data-01-culture.js#heritage",
    "https://artsandculture.google.com": "data-01-culture.js#heritage",
    "https://scratch.mit.edu": "data-01-culture.js#learning",
    "https://commons.wikimedia.org": "data-02-games.js#visual",
    "https://radio.garden": "data-02-games.js#music",
    "https://freerice.com": "data-02-games.js#games",
    "https://flashpointarchive.org": "data-02-games.js#games",
    "https://neal.fun": "data-05-life.js#fun",
    "https://publicdomainreview.org": "data-05-life.js#fun",
}

LINE_RE = re.compile(r'^\s*\["[^"]*",\s*"(https?://[^"]+)"')
CAT_RE = re.compile(r'^\s*id:\s*"([a-zA-Z0-9_-]+)"')


def data_files():
    return sorted(f for f in os.listdir(DATA_DIR)
                  if f.startswith("data-") and f.endswith(".js") and f != "data-base.js")


def main():
    dry = "--dry" in sys.argv
    removed = []
    survivors = set()

    for name in data_files():
        path = os.path.join(DATA_DIR, name)
        with open(path, encoding="utf-8") as fh:
            lines = fh.readlines()

        category = "?"
        kept, changed = [], False
        for line in lines:
            match = CAT_RE.match(line)
            if match:
                category = match.group(1)

            found = LINE_RE.match(line)
            url = found.group(1) if found else None
            rule = RULES.get(url) if url else None

            if rule:
                keep_file, _, keep_cat = rule.partition("#")
                if name != keep_file or (keep_cat and category != keep_cat):
                    removed.append((url, "%s/%s" % (name, category), rule))
                    changed = True
                    continue

            kept.append(line)
            if url:
                survivors.add(url)

        if changed and not dry:
            with open(path, "w", encoding="utf-8") as fh:
                fh.writelines(kept)

    if removed:
        print("%s %d line(s)" % ("would remove" if dry else "removed", len(removed)))
        for url, where, rule in removed:
            print("  %-28s keep in %s" % (where, rule))
    else:
        print("no duplicate entries found")

    for url, rule in RULES.items():
        if url not in survivors:
            print("  warning: %s (%s) not found anywhere" % (url, rule))

    return 0


if __name__ == "__main__":
    sys.exit(main())
