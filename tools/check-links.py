#!/usr/bin/env python3
"""数字博物馆 · 链接体检

用法：
    python3 tools/check-links.py

用 curl 并发探测 assets/js/data-*.js 里的所有 URL，并分成三类：

    失效   404 / 410 / 域名解析不了          —— 必须换掉
    被拦截 401 / 403 / 429 / 5xx             —— 站点活着，只是不让脚本访问
    异常   连接失败但域名能解析              —— 需要人工看一眼

只有「失效」是一定要处理的。
"""

import os
import re
import socket
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

CONCURRENCY = 8
TIMEOUT = 25
RECHECK_ROUNDS = 3
UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

URL_RE = re.compile(r'"(https?://[^"]+)"')
DEAD_CODES = {"404", "410", "451"}
BLOCKED_CODES = {"401", "403", "405", "406", "429"}
_dns_cache = {}


def collect(only=None):
    """only：只检查文件名里包含该子串的数据文件，例如 only='02'。"""
    found = {}
    for name in sorted(os.listdir(DATA_DIR)):
        if not (name.startswith("data-") and name.endswith(".js")):
            continue
        if only and only not in name:
            continue
        with open(os.path.join(DATA_DIR, name), encoding="utf-8") as fh:
            for i, line in enumerate(fh, 1):
                for url in URL_RE.findall(line):
                    found.setdefault(url, "%s:%d" % (name, i))
    return found


def resolves(url):
    host = urlsplit(url).hostname
    if host in _dns_cache:
        return _dns_cache[host]
    try:
        socket.getaddrinfo(host, None)
        ok = True
    except socket.gaierror:
        ok = False
    _dns_cache[host] = ok
    return ok


def fetch(url, retries=0):
    cmd = [
        "curl", "-sS", "-o", "/dev/null", "-L",
        "--max-time", str(TIMEOUT),
        "--retry", str(retries), "--retry-delay", "2", "--retry-connrefused",
        "-A", UA,
        "-H", "Accept: text/html,application/xhtml+xml,*/*;q=0.8",
        "-H", "Accept-Language: zh-CN,zh;q=0.9,en;q=0.8",
        "-w", "%{http_code}",
        url,
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=TIMEOUT * (retries + 1) + 10)
        return (out.stdout or "").strip()[:3]
    except subprocess.TimeoutExpired:
        return "000"


def classify(url, code):
    if code and code[0] in "23":
        return "ok", code
    if code in DEAD_CODES:
        return "dead", code
    if code in BLOCKED_CODES or (code and code[0] == "5"):
        return "blocked", code
    if not resolves(url):
        return "dead", "DNS失败"
    return "odd", code or "000"


def probe(url):
    return classify(url, fetch(url))


def main():
    only = next((a for a in sys.argv[1:] if not a.startswith("-")), None)
    items = list(collect(only).items())
    print("共 %d 个链接，开始体检（并发 %d，全部校验证书）%s\n"
          % (len(items), CONCURRENCY, "，仅 data-%s*" % only if only else ""))

    buckets = {"dead": [], "blocked": [], "odd": []}
    done = [0]

    def work(item):
        url, where = item
        kind, code = probe(url)
        done[0] += 1
        if kind != "ok":
            buckets[kind].append((url, where, code))
            print("  %-7s %-58s [%s]  %s" % (kind, url, code, where))
        if done[0] % 50 == 0:
            print("    … %d/%d" % (done[0], len(items)))

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        list(pool.map(work, items))

    # 高并发下本机偶发连接失败，会把 github.com 这种站点误判成 000。
    # 对「连接异常」的条目做几轮串行复检，只有仍然失败才算数。
    if buckets["odd"]:
        print("\n对 %d 个连接异常条目做串行复检…" % len(buckets["odd"]))
        import time
        still, todo = [], list(buckets["odd"])
        for n, (url, where, _) in enumerate(todo, 1):
            kind = "odd"
            for _round in range(RECHECK_ROUNDS):
                kind, code = classify(url, fetch(url, retries=1))
                if kind != "odd":
                    break
                time.sleep(1.5)
            if kind == "odd":
                still.append((url, where, code))
                print("    ✗ 复检仍失败 %s" % url)
            elif kind != "ok":          # 复检判定为正常的不再入桶，直接计入 ok
                buckets[kind].append((url, where, code))
            if n % 10 == 0:
                print("    … 复检 %d/%d，已确认原本正常 %d 个"
                      % (n, len(todo), n - len(still)))
            time.sleep(0.4)
        buckets["odd"] = still

    ok = len(items) - sum(len(v) for v in buckets.values())
    print("\n完成：正常 %d · 失效 %d · 被拦截 %d · 连接异常 %d"
          % (ok, len(buckets["dead"]), len(buckets["blocked"]), len(buckets["odd"])))

    if buckets["dead"]:
        print("\n必须替换的失效链接：")
        for url, where, code in buckets["dead"]:
            print("  %s\t%s\t%s" % (code, url, where))

    if buckets["odd"]:
        print("\n连接异常（域名可解析，需人工确认）：")
        for url, where, code in buckets["odd"]:
            print("  %s\t%s\t%s" % (code, url, where))

    if buckets["blocked"]:
        print("\n被反爬拦截（站点正常，无需处理）：")
        for url, where, code in buckets["blocked"]:
            print("  %s\t%s\t%s" % (code, url, where))

    return 1 if buckets["dead"] else 0


if __name__ == "__main__":
    sys.exit(main())
