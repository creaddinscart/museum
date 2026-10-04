#!/usr/bin/env python3

import os
import re
import socket
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "assets", "js")

CONCURRENCY = 8
TIMEOUT = 25
RECHECK_ROUNDS = 3
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

URL_RE = re.compile(r'"(https?://[^"]+)"')
DEAD_CODES = {"404", "410", "451"}
BLOCKED_CODES = {"401", "403", "405", "406", "429"}
dns_cache = {}


def collect(only=None):
    found = {}
    for name in sorted(os.listdir(DATA_DIR)):
        if not (name.startswith("data-") and name.endswith(".js")):
            continue
        if only and only not in name:
            continue
        with open(os.path.join(DATA_DIR, name), encoding="utf-8") as fh:
            for number, line in enumerate(fh, 1):
                for url in URL_RE.findall(line):
                    found.setdefault(url, "%s:%d" % (name, number))
    return found


def resolves(url):
    host = urlsplit(url).hostname
    if host not in dns_cache:
        try:
            socket.getaddrinfo(host, None)
            dns_cache[host] = True
        except socket.gaierror:
            dns_cache[host] = False
    return dns_cache[host]


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
        done = subprocess.run(cmd, capture_output=True, text=True,
                              timeout=TIMEOUT * (retries + 1) + 10)
        return (done.stdout or "").strip()[:3]
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
        return "dead", "dns-error"
    return "odd", code or "000"


def main():
    only = next((a for a in sys.argv[1:] if not a.startswith("-")), None)
    items = list(collect(only).items())
    print("checking %d link(s), concurrency %d%s\n"
          % (len(items), CONCURRENCY, ", data-%s* only" % only if only else ""))

    buckets = {"dead": [], "blocked": [], "odd": []}
    done = [0]

    def work(item):
        url, where = item
        kind, code = classify(url, fetch(url))
        done[0] += 1
        if kind != "ok":
            buckets[kind].append((url, where, code))
            print("  %-8s %-58s [%s]  %s" % (kind, url, code, where))
        if done[0] % 50 == 0:
            print("    ... %d/%d" % (done[0], len(items)))

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as pool:
        list(pool.map(work, items))

    if buckets["odd"]:
        print("\nrechecking %d unreachable link(s) one at a time" % len(buckets["odd"]))
        still, queue = [], list(buckets["odd"])
        for position, (url, where, _) in enumerate(queue, 1):
            kind = "odd"
            for _round in range(RECHECK_ROUNDS):
                kind, code = classify(url, fetch(url, retries=1))
                if kind != "odd":
                    break
                time.sleep(1.5)
            if kind == "odd":
                still.append((url, where, code))
                print("    still unreachable: %s" % url)
            elif kind != "ok":
                buckets[kind].append((url, where, code))
            if position % 10 == 0:
                print("    ... %d/%d, %d recovered" % (position, len(queue), position - len(still)))
            time.sleep(0.4)
        buckets["odd"] = still

    healthy = len(items) - sum(len(v) for v in buckets.values())
    print("\nhealthy %d | dead %d | blocked %d | unreachable %d"
          % (healthy, len(buckets["dead"]), len(buckets["blocked"]), len(buckets["odd"])))

    if buckets["dead"]:
        print("\nreplace these:")
        for url, where, code in buckets["dead"]:
            print("  %s\t%s\t%s" % (code, url, where))

    if buckets["odd"]:
        print("\nunreachable from this network, check by hand:")
        for url, where, code in buckets["odd"]:
            print("  %s\t%s\t%s" % (code, url, where))

    if buckets["blocked"]:
        print("\nblocked by anti-bot measures, nothing to fix:")
        for url, where, code in buckets["blocked"]:
            print("  %s\t%s\t%s" % (code, url, where))

    return 1 if buckets["dead"] else 0


if __name__ == "__main__":
    sys.exit(main())
