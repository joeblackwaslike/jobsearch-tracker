#!/usr/bin/env python3
"""
Lightweight job board researcher — zero AI tokens.

Fetches a URL with curl, then extracts:
  - Page title, h1, h2
  - <form> action attributes + enctype
  - Links/buttons containing "apply" in href or text
  - network request hints from inline <script> (fetch/XHR calls)
  - Open Graph meta tags (og:title, og:site_name)

Usage:
  python3 research-board.py https://jobs.lever.co/stripe/abc123
  python3 research-board.py https://jobs.lever.co/stripe/abc123 --depth 2

Output: compact markdown summary written to stdout.
"""

import sys
import re
import subprocess
import json
import urllib.parse
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# HTML parser — extracts only the signals we care about
# ---------------------------------------------------------------------------

class BoardParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.h1s = []
        self.h2s = []
        self.forms = []       # [{action, method, enctype}]
        self.apply_links = [] # [{href, text}]
        self.metas = {}       # name/property -> content
        self.scripts = []     # inline script text (first 2000 chars each)
        self._cur_tag = None
        self._cur_form = None
        self._capture_text = None
        self._text_buf = ""

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self._cur_tag = tag

        if tag == "title":
            self._capture_text = "title"
            self._text_buf = ""

        elif tag == "h1":
            self._capture_text = "h1"
            self._text_buf = ""

        elif tag == "h2":
            self._capture_text = "h2"
            self._text_buf = ""

        elif tag == "form":
            self._cur_form = {
                "action": attrs.get("action", ""),
                "method": attrs.get("method", "GET").upper(),
                "enctype": attrs.get("enctype", ""),
            }
            self.forms.append(self._cur_form)

        elif tag == "meta":
            prop = attrs.get("property") or attrs.get("name") or ""
            if prop and "content" in attrs:
                self.metas[prop] = attrs["content"]

        elif tag in ("a", "button"):
            href = attrs.get("href", "")
            cls = attrs.get("class", "")
            text_hint = attrs.get("aria-label", "") or attrs.get("data-label", "")
            is_apply = (
                "apply" in href.lower()
                or "apply" in cls.lower()
                or "apply" in text_hint.lower()
            )
            if is_apply or "apply" in (attrs.get("id", "") or "").lower():
                self._capture_text = "apply"
                self._text_buf = ""
                self.__apply_attrs = {"href": href, "class": cls}

        elif tag == "script" and not attrs.get("src"):
            self._capture_text = "script"
            self._text_buf = ""

    def handle_data(self, data):
        if self._capture_text:
            self._text_buf += data

    def handle_endtag(self, tag):
        if self._capture_text == "title" and tag == "title":
            self.title = self._text_buf.strip()
            self._capture_text = None

        elif self._capture_text == "h1" and tag == "h1":
            self.h1s.append(self._text_buf.strip())
            self._capture_text = None

        elif self._capture_text == "h2" and tag == "h2":
            h = self._text_buf.strip()
            if h:
                self.h2s.append(h)
            self._capture_text = None

        elif self._capture_text == "apply" and tag in ("a", "button"):
            text = self._text_buf.strip()
            entry = {**self.__apply_attrs, "text": text}
            if entry not in self.apply_links:
                self.apply_links.append(entry)
            self._capture_text = None

        elif self._capture_text == "script" and tag == "script":
            src = self._text_buf
            # Extract fetch/XHR/axios calls (first 2000 chars)
            self.scripts.append(src[:2000])
            self._capture_text = None


# ---------------------------------------------------------------------------
# Network hint extraction from inline JS
# ---------------------------------------------------------------------------

FETCH_PATTERNS = [
    r"""fetch\(['"](https?://[^'"]+|/[^'"]+)""",
    r"""axios\.(get|post|put|patch)\(['"](https?://[^'"]+|/[^'"]+)""",
    r"""XMLHttpRequest[^;]*\.open\(['"](GET|POST|PUT|PATCH)['"]\s*,\s*['"](https?://[^'"]+|/[^'"]+)""",
    r"""url:\s*['"](https?://[^'"]+|/[^'"]+)""",
    r"""\$\.ajax[^;]*url:\s*['"](https?://[^'"]+|/[^'"]+)""",
    r"""(["'])(https?://[^"']+/api/[^"']+)\1""",
    r"""(["'])(https?://[^"']+/submit[^"']*)\1""",
    r"""(["'])(https?://[^"']+/apply[^"']*)\1""",
]

def extract_network_hints(scripts):
    seen = set()
    hints = []
    for src in scripts:
        for pat in FETCH_PATTERNS:
            for m in re.finditer(pat, src, re.IGNORECASE):
                url = m.group(m.lastindex)
                if url not in seen:
                    seen.add(url)
                    hints.append(url)
    return hints[:20]  # cap at 20


# ---------------------------------------------------------------------------
# Fetch page HTML via curl (follows redirects, sets a browser UA)
# ---------------------------------------------------------------------------

UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/122.0.0.0 Safari/537.36"
)

def fetch(url, timeout=15):
    """Return (final_url, html) or raise."""
    result = subprocess.run(
        [
            "curl", "-sL",           # silent, follow redirects
            "--max-time", str(timeout),
            "-A", UA,
            "-H", "Accept: text/html,application/xhtml+xml",
            "-H", "Accept-Language: en-US,en;q=0.9",
            "-w", "\n__FINAL_URL__:%{url_effective}",
            url,
        ],
        capture_output=True,
        text=True,
        timeout=timeout + 5,
    )
    body = result.stdout
    final_url = url
    if "\n__FINAL_URL__:" in body:
        body, url_line = body.rsplit("\n__FINAL_URL__:", 1)
        final_url = url_line.strip()
    return final_url, body


# ---------------------------------------------------------------------------
# Main research function
# ---------------------------------------------------------------------------

def research(url):
    print(f"\n## Fetching: {url}", flush=True)
    try:
        final_url, html = fetch(url)
    except Exception as e:
        print(f"ERROR fetching {url}: {e}")
        return

    parsed = urllib.parse.urlparse(final_url)
    host = parsed.netloc

    parser = BoardParser()
    try:
        parser.feed(html)
    except Exception:
        pass  # partial parse is fine

    network_hints = extract_network_hints(parser.scripts)

    # ---- output ----
    lines = [
        f"\n# Research: {host}",
        f"**Input URL:** {url}",
        f"**Final URL:** {final_url}",
        "",
        f"**Title:** {parser.title}",
        f"**OG title:** {parser.metas.get('og:title', '')}",
        f"**OG site:** {parser.metas.get('og:site_name', '')}",
        "",
        "## Headings",
        f"H1: {parser.h1s[:3]}",
        f"H2: {parser.h2s[:8]}",
        "",
        "## Forms",
    ]
    if parser.forms:
        for f in parser.forms:
            lines.append(f"  - action={f['action']!r}  method={f['method']}  enctype={f['enctype']!r}")
    else:
        lines.append("  (none found)")

    lines += ["", "## Apply Links/Buttons"]
    if parser.apply_links:
        for a in parser.apply_links[:10]:
            lines.append(f"  - href={a['href']!r}  text={a['text']!r}  class={a['class']!r}")
    else:
        lines.append("  (none found — may be SPA / JS-rendered)")

    lines += ["", "## Network Hints (from inline JS)"]
    if network_hints:
        for h in network_hints:
            lines.append(f"  - {h}")
    else:
        lines.append("  (none found)")

    # Raw HTML size gives a sense of how much there is
    lines += [
        "",
        f"**HTML size:** {len(html):,} chars",
        f"**Inline scripts:** {len(parser.scripts)}",
        "",
        "---",
    ]

    print("\n".join(lines))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 research-board.py <url> [<url2> ...]")
        sys.exit(1)

    for url in sys.argv[1:]:
        research(url)
