"""CSP coverage and compatibility with the actual static pages and edge challenge."""
from html.parser import HTMLParser
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]


class Sources(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inline_styles = 0
        self.inline_scripts = 0
        self.style_attributes = 0
        self.external_scripts = []
        self.current = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.style_attributes += "style" in attrs
        if tag in ("style", "script"):
            self.current = tag if tag == "style" or not attrs.get("src") else None
            if tag == "script" and attrs.get("src"):
                self.external_scripts.append(attrs["src"])

    def handle_data(self, data):
        if self.current == "style" and data.strip():
            self.inline_styles += 1
        if self.current == "script" and data.strip():
            self.inline_scripts += 1

    def handle_endtag(self, tag):
        if tag in ("style", "script"):
            self.current = None


class CSPTests(unittest.TestCase):
    def test_header_is_report_only_until_edge_compatibility_is_proven(self):
        lines = (ROOT / "_headers").read_text().splitlines()
        # Netlify wildcard covers index, /start (built guide), and /guide redirects.
        self.assertEqual(lines[0], "/*")
        headers = dict(line.strip().split(": ", 1) for line in lines[1:] if ": " in line)
        self.assertNotIn("Content-Security-Policy", headers)
        policy = headers["Content-Security-Policy-Report-Only"]
        directives = dict((parts[0], parts[1:]) for directive in policy.split("; ")
                          if (parts := directive.split()))
        for name, required in {
            "default-src": {"'self'"}, "object-src": {"'none'"},
            "base-uri": {"'self'"}, "frame-ancestors": {"'self'"},
            "script-src": {"'self'", "'unsafe-inline'", "https://challenges.cloudflare.com"},
            "style-src": {"'self'", "'unsafe-inline'"},
            "img-src": {"'self'", "data:"},
            "connect-src": {"'self'", "https://challenges.cloudflare.com"},
            "frame-src": {"https://challenges.cloudflare.com"},
        }.items():
            self.assertTrue(required <= set(directives[name]), (name, directives[name]))
        for name in ("index.html", "guide.html"):
            parser = Sources()
            parser.feed((ROOT / name).read_text())
            self.assertGreater(parser.inline_styles, 0)
            self.assertGreater(parser.style_attributes, 0)
            if name == "guide.html":
                self.assertGreater(parser.inline_scripts, 0)
            self.assertTrue(all(src.startswith("/assets/") for src in parser.external_scripts))


if __name__ == "__main__":
    unittest.main()
