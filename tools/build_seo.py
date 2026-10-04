#!/usr/bin/env python3

import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")
SITE = "https://m.shit.pub"
INDEX = os.path.join(ROOT, "index.html")
SITEMAP = os.path.join(ROOT, "sitemap.xml")

PAIRS = {")": "(", "]": "[", "}": "{"}


def split_top_level(text, sep=","):
    parts, buf, depth, quote, i = [], [], 0, None, 0
    while i < len(text):
        ch = text[i]
        if quote:
            buf.append(ch)
            if ch == "\\" and i + 1 < len(text):
                buf.append(text[i + 1])
                i += 1
            elif ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
            buf.append(ch)
        elif ch in "([{":
            depth += 1
            buf.append(ch)
        elif ch in ")]}":
            depth -= 1
            buf.append(ch)
        elif ch == sep and depth == 0:
            parts.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
        i += 1
    tail = "".join(buf).strip()
    if tail:
        parts.append(tail)
    return parts


def push_blocks(text):
    for m in re.finditer(r"MUSEUM_CATEGORIES\.push", text):
        start = text.find("(", m.end()) + 1
        depth, i, quote = 0, start, None
        while i < len(text):
            ch = text[i]
            if quote:
                if ch == "\\":
                    i += 1
                elif ch == quote:
                    quote = None
            elif ch in "\"'`":
                quote = ch
            elif ch in "([{":
                depth += 1
            elif ch in ")]}":
                depth -= 1
                if depth == 0:
                    yield text[start:i]
                    break
            i += 1


def scalar(block, key):
    m = re.search(r'\b%s\s*:\s*"([^"]*)"' % re.escape(key), block)
    return m.group(1) if m else ""


def sites(block):
    m = re.search(r"\bsites\s*:\s*\[", block)
    if not m:
        return []
    depth, i, start = 0, m.end() - 1, m.end() - 1
    while i < len(block):
        if block[i] == "[":
            depth += 1
        elif block[i] == "]":
            depth -= 1
            if depth == 0:
                raw = block[start + 1:i]
                break
        i += 1
    else:
        return []

    out = []
    for entry in split_top_level(raw):
        if not entry.startswith("["):
            continue
        fields = split_top_level(entry[1:-1])
        if len(fields) != 6:
            continue
        out.append({
            "name": fields[0][1:-1],
            "url": fields[1][1:-1],
            "desc": fields[2][1:-1],
            "region": fields[3][1:-1],
            "lang": fields[4][1:-1],
            "tags": [t.strip()[1:-1] for t in split_top_level(fields[5][1:-1]) if t.strip()],
        })
    return out


def load():
    categories = []
    for name in sorted(os.listdir(DATA_DIR)):
        if not (name.startswith("data-") and name.endswith(".js")) or name == "data-base.js":
            continue
        with open(os.path.join(DATA_DIR, name), encoding="utf-8") as fh:
            text = fh.read()
        for block in push_blocks(text):
            categories.append({
                "id": scalar(block, "id"),
                "name": scalar(block, "name"),
                "short": scalar(block, "short"),
                "note": scalar(block, "note"),
                "restricted": "restricted: true" in block,
                "sites": sites(block),
            })
    return categories


def esc(text):
    return (str(text).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def directory_html(categories):
    total = sum(len(c["sites"]) for c in categories)
    out = ['<p>本站共收录 %d 个网站，分 %d 个展区。以下是完整目录。</p>' % (total, len(categories))]
    for category in categories:
        marker = "（受地区限制）" if category["restricted"] else ""
        out.append('<h2 id="cat-%s">%s%s</h2>' % (esc(category["id"]), esc(category["name"]), marker))
        if category["note"]:
            out.append("<p>%s</p>" % esc(category["note"]))
        out.append("<ul>")
        for site in category["sites"]:
            out.append(
                '<li><a href="%s" rel="noopener">%s</a>'
                '<span class="host">%s</span> — %s</li>'
                % (esc(site["url"]), esc(site["name"]), esc(site["url"].split("/")[2]),
                   esc(site["desc"]))
            )
        out.append("</ul>")
    return "\n".join(out)


def collection_json(categories):
    total = sum(len(c["sites"]) for c in categories)
    items = []
    for index, category in enumerate(categories, 1):
        items.append({
            "@type": "ItemList",
            "position": index,
            "name": category["name"],
            "url": "%s/?view=%s" % (SITE, category["id"]),
            "numberOfItems": len(category["sites"]),
        })
    return (
        '{\n'
        '  "@context": "https://schema.org",\n'
        '  "@type": "CollectionPage",\n'
        '  "name": "数字博物馆",\n'
        '  "url": "%s/",\n'
        '  "inLanguage": "zh-CN",\n'
        '  "mainEntity": {\n'
        '    "@type": "ItemList",\n'
        '    "numberOfItems": %d,\n'
        '    "itemListElement": %s\n'
        '  }\n'
        '}' % (SITE, total, _js(items))
    )


def _js(value, indent=4):
    import json
    return json.dumps(value, ensure_ascii=False, indent=2).replace("\n", "\n" + " " * indent)


def sitemap_xml(categories):
    today = date.today().isoformat()
    rows = ['  <url>', '    <loc>%s/</loc>' % SITE,
            '    <lastmod>%s</lastmod>' % today,
            '    <changefreq>weekly</changefreq>',
            '    <priority>1.0</priority>', '  </url>']
    for category in categories:
        rows += ['  <url>', '    <loc>%s/?view=%s</loc>' % (SITE, category["id"]),
                 '    <lastmod>%s</lastmod>' % today,
                 '    <changefreq>monthly</changefreq>',
                 '    <priority>0.7</priority>', '  </url>']
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "\n".join(rows) + "\n</urlset>\n")


def replace_block(html, pattern, payload, label):
    new, count = re.subn(pattern, lambda m: m.group(1) + payload + m.group(2), html, count=1,
                         flags=re.S)
    if count != 1:
        print("ERROR: could not find %s in index.html" % label)
        return html, False
    return new, True


def main():
    categories = load()
    if not categories:
        print("ERROR: no categories found")
        return 1

    with open(INDEX, encoding="utf-8") as fh:
        html = fh.read()

    html, ok1 = replace_block(
        html,
        r'(<div class="noscript" id="directory">).*?(</div>)',
        "\n" + directory_html(categories) + "\n      ",
        "directory block")
    html, ok2 = replace_block(
        html,
        r'(<script type="application/ld\+json" id="ld-collection">).*?(</script>)',
        "\n" + collection_json(categories) + "\n",
        "ld-collection block")

    if not (ok1 and ok2):
        return 1

    with open(INDEX, "w", encoding="utf-8") as fh:
        fh.write(html)
    with open(SITEMAP, "w", encoding="utf-8") as fh:
        fh.write(sitemap_xml(categories))

    total = sum(len(c["sites"]) for c in categories)
    print("index.html  : directory with %d sites" % total)
    print("index.html  : JSON-LD ItemList with %d categories" % len(categories))
    print("sitemap.xml : %d URLs" % (len(categories) + 1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
