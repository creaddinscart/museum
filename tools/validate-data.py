#!/usr/bin/env python3
"""数字博物馆 · 数据校验

用法：
    python3 tools/validate-data.py

检查 assets/js/data-*.js：
  · 括号 / 引号是否配平
  · 每个展区是否有 id / name / icon / sites
  · 每条展品是否为 6 元组 [名称, https链接, 简介, 地区, 语言, 标签数组]
  · id 是否重复、URL 是否重复、描述长度是否合理
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

PAIRS = {")": "(", "]": "[", "}": "{"}


def strip_comments(text):
    """去掉 // 与 /* */ 注释，但保留换行以便行号仍然准确。
    字符串里的 // （例如 https://）不会被误伤。"""
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
        elif ch == "/" and text.startswith("//", i):
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        elif ch == "/" and text.startswith("/*", i):
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
    """按顶层分隔符切分，跳过字符串与括号内部。"""
    parts, buf, depth, i, quote = [], [], 0, 0, None
    while i < len(text):
        ch = text[i]
        if quote:
            buf.append(ch)
            if ch == "\\":
                if i + 1 < len(text):
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
    stack, quote, i = [], None, 0
    line = 1
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
                errors.append("%s:%d 多余的 %s" % (where, line, ch))
                return
            opener, oline = stack.pop()
            if opener != PAIRS[ch]:
                errors.append("%s:%d %s 与第 %d 行的 %s 不匹配" % (where, line, ch, oline, opener))
                return
        i += 1
    if stack:
        errors.append("%s 有 %d 个括号未闭合（最后一个是第 %d 行的 %s）"
                      % (where, len(stack), stack[-1][1], stack[-1][0]))
    if quote:
        errors.append("%s 有未闭合的字符串引号 %s" % (where, quote))


def find_blocks(text, marker="MUSEUM_CATEGORIES.push"):
    """返回每个 push(...) 的内容（去掉外层括号）。"""
    blocks = []
    for m in re.finditer(re.escape(marker), text):
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
    m = re.search(r'\bsites\s*:\s*\[', block)
    if not m:
        return None
    i = m.end() - 1
    depth = 0
    start = i
    while i < len(block):
        ch = block[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                return block[start + 1:i]
        i += 1
    return None


def strlit(x):
    return x[1:-1] if len(x) >= 2 and x[0] in "\"'" else None


def main():
    errors, seen_ids, seen_urls = [], {}, {}
    files = [f for f in sorted(os.listdir(DATA_DIR))
             if f.startswith("data-") and f.endswith(".js") and f != "data-base.js"]
    total_sites = total_cats = 0

    for name in files:
        path = os.path.join(DATA_DIR, name)
        with open(path, encoding="utf-8") as fh:
            text = strip_comments(fh.read())

        where = "assets/js/" + name
        check_balance(text, where, errors)

        blocks = find_blocks(text)
        if not blocks:
            errors.append("%s 里没有找到 MUSEUM_CATEGORIES.push({...})" % where)
            continue

        for block in blocks:
            cat_id = field(block, "id")
            cat_name = field(block, "name")
            icon = field(block, "icon")
            note = field(block, "note")

            for key, val in (("id", cat_id), ("name", cat_name), ("icon", icon), ("note", note)):
                if not val:
                    errors.append("%s 展区缺少 %s 字段" % (where, key))
            if cat_id:
                if cat_id in seen_ids:
                    errors.append("%s 展区 id 「%s」与 %s 重复" % (where, cat_id, seen_ids[cat_id]))
                else:
                    seen_ids[cat_id] = where

            raw = sites_block(block)
            if raw is None:
                errors.append("%s 展区「%s」缺少 sites 数组" % (where, cat_name))
                continue

            entries = [e for e in split_top_level(raw) if e.strip()]
            total_cats += 1
            total_sites += len(entries)
            bad_len = 0

            for idx, entry in enumerate(entries, 1):
                if not entry.startswith("["):
                    errors.append("%s 展区「%s」第 %d 条目不是数组：%s"
                                  % (where, cat_name, idx, entry[:50]))
                    continue
                fields = split_top_level(entry[1:-1])
                if len(fields) != 6:
                    bad_len += 1
                    errors.append("%s 展区「%s」第 %d 条目是 %d 元组（应为 6）：%s"
                                  % (where, cat_name, idx, len(fields), entry[:70]))
                    continue

                sname = strlit(fields[0])
                url = strlit(fields[1])
                desc = strlit(fields[2])
                region = strlit(fields[3])
                lang = strlit(fields[4])
                tags_raw = fields[5]

                if not sname:
                    errors.append("%s「%s」第 %d 条目缺少名称" % (where, cat_name, idx))
                if not url or not url.startswith("https://"):
                    errors.append("%s「%s」第 %d 条目的链接不是 https：%s"
                                  % (where, cat_name, idx, url))
                elif url in seen_urls:
                    errors.append("%s 中「%s」的链接 %s 已在 %s 出现过"
                                  % (where, sname, url, seen_urls[url]))
                elif url:
                    seen_urls[url] = "%s·%s" % (where, sname)
                if desc and not (15 <= len(desc) <= 90):
                    errors.append("%s「%s」简介长度 %d 字（建议 15–90）：%s"
                                  % (where, sname, len(desc), desc[:40]))
                if not region:
                    errors.append("%s「%s」缺少地区" % (where, sname))
                if not lang:
                    errors.append("%s「%s」缺少语言" % (where, sname))
                if not tags_raw.startswith("[") or not tags_raw.endswith("]"):
                    errors.append("%s「%s」标签不是数组" % (where, sname))

            print("%-26s %-16s %3d 条  %s" % (name, cat_id, len(entries), cat_name))
            if bad_len:
                print("    ↳ %d 条格式不符" % bad_len)

    print("\n合计：%d 个展区，%d 件展品。" % (total_cats, total_sites))

    if errors:
        print("\n发现 %d 个问题：" % len(errors))
        for e in errors:
            print("  · " + e)
        return 1

    print("数据格式检查通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
