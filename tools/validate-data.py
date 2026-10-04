#!/usr/bin/env python3

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

PAIRS = {")": "(", "]": "[", "}": "{"}
REQUIRED_FIELDS = ("id", "name", "short", "note")


def strip_comments(text):
    out, i, quote = [], 0, None
    while i < len(text):
        ch = text[i]
        if quote:
            out.append(ch)
            if ch == "\\" and i + 1 < len(text):
                out.append(text[i + 1])
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
            out.append(ch)
        elif text.startswith("//", i):
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        elif text.startswith("/*", i):
            i += 2
            while i + 1 < len(text) and not text.startswith("*/", i):
                if text[i] == "\n":
                    out.append("\n")
                i += 1
            i += 2
            continue
        else:
            out.append(ch)
        i += 1
    return "".join(out)


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


def check_balance(text, where, errors):
    stack, quote, i, line = [], None, 0, 1
    while i < len(text):
        ch = text[i]
        if ch == "\n":
            line += 1
        if quote:
            if ch == "\\":
                i += 1
            elif ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif ch in "([{":
            stack.append((ch, line))
        elif ch in ")]}":
            if not stack:
                errors.append("%s:%d stray %s" % (where, line, ch))
                return
            opener, oline = stack.pop()
            if opener != PAIRS[ch]:
                errors.append("%s:%d %s does not match %s on line %d"
                              % (where, line, ch, opener, oline))
                return
        i += 1
    if stack:
        errors.append("%s has %d unclosed bracket(s), last opened on line %d"
                      % (where, len(stack), stack[-1][1]))
    if quote:
        errors.append("%s has an unterminated string" % where)


def find_blocks(text):
    blocks = []
    for m in re.finditer(r"MUSEUM_CATEGORIES\.push", text):
        start = text.find("(", m.end()) + 1
        if start == 0:
            continue
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
                    blocks.append(text[start:i])
                    break
            i += 1
    return blocks


def field(block, key):
    m = re.search(r'\b%s\s*:\s*' % re.escape(key), block)
    if not m:
        return None
    i = m.end()
    while i < len(block) and block[i].isspace():
        i += 1
    if i < len(block) and block[i] in "\"'":
        q, j, out = block[i], i + 1, []
        while j < len(block) and block[j] != q:
            out.append(block[j])
            j += 1
        return "".join(out)
    return block[i:i + 40].strip()


def sites_block(block):
    m = re.search(r"\bsites\s*:\s*\[", block)
    if not m:
        return None
    depth, i, start = 0, m.end() - 1, m.end() - 1
    while i < len(block):
        if block[i] == "[":
            depth += 1
        elif block[i] == "]":
            depth -= 1
            if depth == 0:
                return block[start + 1:i]
        i += 1
    return None


def strlit(x):
    return x[1:-1] if len(x) >= 2 and x[0] in "\"'" else None


def main():
    errors, seen_ids, seen_urls, seen_short = [], {}, {}, {}
    files = [f for f in sorted(os.listdir(DATA_DIR))
             if f.startswith("data-") and f.endswith(".js") and f != "data-base.js"]
    total_sites = total_cats = 0

    for name in files:
        with open(os.path.join(DATA_DIR, name), encoding="utf-8") as fh:
            text = strip_comments(fh.read())

        where = "assets/js/" + name
        check_balance(text, where, errors)

        blocks = find_blocks(text)
        if not blocks:
            errors.append("%s has no MUSEUM_CATEGORIES.push({...}) block" % where)
            continue

        for block in blocks:
            values = {key: field(block, key) for key in REQUIRED_FIELDS}
            for key, value in values.items():
                if not value:
                    errors.append("%s category is missing the %s field" % (where, key))

            cat_id = values["id"]
            cat_name = values["name"]
            if cat_id:
                if cat_id in seen_ids:
                    errors.append("%s category id %s already used in %s"
                                  % (where, cat_id, seen_ids[cat_id]))
                else:
                    seen_ids[cat_id] = where
            short = values["short"]
            if short and not (2 <= len(short) <= 3):
                errors.append("%s short name %s should be 2-3 characters" % (where, short))
            if short:
                if short in seen_short:
                    errors.append("%s short name %s already used by %s"
                                  % (where, short, seen_short[short]))
                else:
                    seen_short[short] = cat_id or where

            raw = sites_block(block)
            if raw is None:
                errors.append("%s category %s has no sites array" % (where, cat_name))
                continue

            entries = [e for e in split_top_level(raw) if e.strip()]
            total_cats += 1
            total_sites += len(entries)

            for idx, entry in enumerate(entries, 1):
                if not entry.startswith("["):
                    errors.append("%s %s item %d is not an array" % (where, cat_name, idx))
                    continue
                fields = split_top_level(entry[1:-1])
                if len(fields) != 6:
                    errors.append("%s %s item %d has %d fields, expected 6"
                                  % (where, cat_name, idx, len(fields)))
                    continue

                sname = strlit(fields[0])
                url = strlit(fields[1])
                desc = strlit(fields[2])
                region = strlit(fields[3])
                lang = strlit(fields[4])
                tags = fields[5]

                if not sname:
                    errors.append("%s %s item %d has no name" % (where, cat_name, idx))
                if not url or not url.startswith("https://"):
                    errors.append("%s %s item %d is not an https url: %s"
                                  % (where, cat_name, idx, url))
                elif url in seen_urls:
                    errors.append("%s %s reuses %s, already listed in %s"
                                  % (where, sname, url, seen_urls[url]))
                else:
                    seen_urls[url] = "%s/%s" % (where, sname)
                if desc and not (15 <= len(desc) <= 90):
                    errors.append("%s %s description is %d characters"
                                  % (where, sname, len(desc)))
                if not region:
                    errors.append("%s %s has no region" % (where, sname))
                if not lang:
                    errors.append("%s %s has no language" % (where, sname))
                if not tags.startswith("[") or not tags.endswith("]"):
                    errors.append("%s %s tags are not an array" % (where, sname))

            print("%-24s %-12s %4d  %s" % (name, cat_id, len(entries), cat_name))

    print("\n%d categories, %d sites" % (total_cats, total_sites))

    if errors:
        print("\n%d problem(s):" % len(errors))
        for error in errors:
            print("  - " + error)
        return 1

    print("data validation passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
