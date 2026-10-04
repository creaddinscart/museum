#!/usr/bin/env python3
"""数字博物馆 · 跨展区去重

同一个网站只应出现在一个展区。展区一多，撞车几乎不可避免，
所以用这张「保留表」明确每个网址的归属，其余位置那一行会被删掉。

保留表的写法：
    "https://example.com": "data-03-dev.js"          # 只保留在这个文件
    "https://example.com": "data-04-money.js#news"   # 只保留在这个文件的 news 展区

用法：
    python3 tools/dedupe.py           # 按 RULES 清理
    python3 tools/dedupe.py --dry     # 只看会删什么，不动文件
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

# 网址 -> 保留在哪（依据：哪个展区最贴切）
RULES = {
    # 航天与探索 / 健康与生活 / 公益与社会 / 搜索与导航
    "https://www.nasa.gov": "data-05-life.js",
    "https://www.esa.int": "data-05-life.js",
    "https://www.who.int": "data-05-life.js",
    "https://www.iucnredlist.org": "data-05-life.js",
    "https://www.semanticscholar.org": "data-05-life.js",
    "https://core.ac.uk": "data-05-life.js",

    # 科学与研究 / 学习与教育
    "https://pubmed.ncbi.nlm.nih.gov": "data-01-culture.js",
    "https://www.zooniverse.org": "data-01-culture.js",
    "https://ocw.mit.edu": "data-01-culture.js",
    "https://archive.org": "data-01-culture.js",

    # 编程与开发 / 工具与效率
    "https://www.freecodecamp.org": "data-03-dev.js",
    "https://www.theodinproject.com": "data-03-dev.js",
    "https://www.wolframalpha.com": "data-03-dev.js",

    # 数据与开放数据（统计口径的归这里）
    "https://data.worldbank.org": "data-03-dev.js",
    "https://www.stats.gov.cn": "data-03-dev.js",
    "https://ourworldindata.org": "data-03-dev.js",
    "https://ec.europa.eu/eurostat": "data-03-dev.js",
    "https://www.openstreetmap.org": "data-03-dev.js#opendata",

    # 金融与经济
    "https://fred.stlouisfed.org": "data-04-money.js#finance",

    # 新闻与信息
    "https://www.caixin.com": "data-04-money.js#news",
    "https://www.bbc.com": "data-04-money.js#news",

    # 博物馆与文化遗产（同类站点一律归这里）
    "https://www.rijksmuseum.nl": "data-01-culture.js#heritage",
    "https://www.europeana.eu": "data-01-culture.js#heritage",
    "https://artsandculture.google.com": "data-01-culture.js#heritage",
    "https://scratch.mit.edu": "data-01-culture.js#learning",

    # 图片与视觉 / 音乐与声音
    "https://commons.wikimedia.org": "data-02-games.js#visual",
    "https://radio.garden": "data-02-games.js#music",

    # 游戏
    "https://freerice.com": "data-02-games.js#games",
    "https://flashpointarchive.org": "data-02-games.js#games",

    # 冷门与趣味
    "https://neal.fun": "data-05-life.js#fun",
    "https://publicdomainreview.org": "data-05-life.js#fun",
}

LINE_RE = re.compile(r'^\s*\["[^"]*",\s*"(https?://[^"]+)"')
CAT_RE = re.compile(r'^\s*id:\s*"([a-zA-Z0-9_-]+)"')


def files():
    return sorted(f for f in os.listdir(DATA_DIR)
                  if f.startswith("data-") and f.endswith(".js") and f != "data-base.js")


def main():
    dry = "--dry" in sys.argv
    removed = []
    survivors = set()

    for name in files():
        path = os.path.join(DATA_DIR, name)
        with open(path, encoding="utf-8") as fh:
            lines = fh.readlines()

        cat = "?"
        out, changed = [], False
        for line in lines:
            m = CAT_RE.match(line)
            if m:
                cat = m.group(1)

            u = LINE_RE.match(line)
            url = u.group(1) if u else None
            rule = RULES.get(url) if url else None

            if rule:
                keep_file, _, keep_cat = rule.partition("#")
                if name != keep_file or (keep_cat and cat != keep_cat):
                    removed.append((url, "%s·%s" % (name, cat), rule))
                    changed = True
                    continue

            out.append(line)
            if url:
                survivors.add(url)

        if changed and not dry:
            with open(path, "w", encoding="utf-8") as fh:
                fh.writelines(out)

    if removed:
        print("%s %d 行：" % ("将删除" if dry else "已删除", len(removed)))
        for url, where, rule in removed:
            print("  %-26s → 保留在 %s" % (where, rule))
    else:
        print("没有发现需要清理的重复条目。")

    for url, rule in RULES.items():
        if url not in survivors:
            print("  ⚠ 保留表里的 %s（%s）哪里都找不到，可能拼错了" % (url, rule))

    return 0


if __name__ == "__main__":
    sys.exit(main())
