#!/usr/bin/env python3
"""
Fonts for the home greeting (components/home/Greeting.tsx): one tiny WOFF2 per script,
cut down to just the letters of its greeting, at Medium (500).

Google Fonts does the cutting (its css2 API takes `text=` and returns a font holding only
those characters, shaping rules included), and the files are saved into the site, so
visitors never fetch from Google. Anek covers the Indian scripts; Noto the rest. The
Latin words (Hello, Enchanté, Ciao) are set in the site's own Arial and need no file.
All are SIL Open Font License.

Keep FILES in step with HOME.greetings in data/site.ts, then:

    python3 scripts/hello-fonts.py          # writes public/media/hello/*.woff2
"""

import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "media" / "hello"

# file name -> (Google Fonts family, the text it must cover)
FILES = {
    "bangla": ("Anek Bangla", "নমস্কার"),
    "devanagari": ("Anek Devanagari", "नमस्ते"),
    "kannada": ("Anek Kannada", "ನಮಸ್ಕಾರ"),
    "japanese": ("Noto Sans JP", "こんにちは"),
    "arabic": ("Noto Sans Arabic", "مرحبا"),
    "korean": ("Noto Sans KR", "안녕하세요"),
    "greek-cyrillic": ("Noto Sans", "Γεια σου Привет"),
    "thai": ("Noto Sans Thai", "สวัสดี"),
    "chinese": ("Noto Sans SC", "你好"),
    "hebrew": ("Noto Sans Hebrew", "שלום"),
    "sinhala": ("Noto Sans Sinhala", "ආයුබෝවන්"),
    "ethiopic": ("Noto Sans Ethiopic", "ሰላም"),
    "georgian": ("Noto Sans Georgian", "გამარჯობა"),
}

# Google serves WOFF2 only to browsers it knows support it.
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (family, text) in FILES.items():
        query = urllib.parse.urlencode({"family": f"{family}:wght@500", "text": text, "display": "swap"})
        css = get(f"https://fonts.googleapis.com/css2?{query}").decode()
        urls = re.findall(r"url\((https://[^)]+)\) format\('woff2'\)", css)
        if len(urls) != 1:
            sys.exit(f"{name}: expected one woff2 in the CSS, got {len(urls)}\n{css}")
        data = get(urls[0])
        (OUT / f"{name}.woff2").write_bytes(data)
        print(f"{name:15s} {len(data):6d} B  {family}  {text}")


if __name__ == "__main__":
    main()
