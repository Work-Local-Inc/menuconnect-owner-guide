#!/usr/bin/env python3
"""Check the curriculum, local assets, HTML IDs, and inline JavaScript."""
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import tempfile

root = Path(__file__).resolve().parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.lessons = []
    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if "id" in data:
            self.ids.append(data["id"])
        if tag == "section" and "lesson" in data.get("class", "").split():
            self.lessons.append(data.get("data-title"))

expected = ["Welcome", "Signing in", "Your owner home", "Weekly statements",
    "Cash, card & refunds", "Opening hours", "Split shifts", "Holidays & closures",
    "Close today safely", "Prices & availability", "Availability routine",
    "Photos & bilingual editing", "Orders", "Promotions", "We handle these",
    "Ask for help clearly", "Owner routine", "Quick check"]
for name in ["index.html", "guide.html"]:
    source = (root / name).read_text()
    page = Page()
    page.feed(source)
    assert len(page.ids) == len(set(page.ids)), f"Duplicate HTML IDs: {name}"
    if name == "guide.html":
        assert page.lessons == expected, "Guide curriculum is incomplete or reordered"
        assert source.count("{q:'") == 15, "Expected 15 final-check scenarios"
        assert "orderDetailView" in source and "backToOrders" in source, "Order detail practice missing"
    else:
        assert "Easy order and customer management" in source, "Order management section missing"
        assert source.count('href="/guide"') + source.count('href="/start"') >= 3, "Guide links missing"
    for asset in set(re.findall(r"assets/[A-Za-z0-9_./-]+", source)):
        assert (root / asset).is_file(), f"Missing asset: {asset}"
    assert "/cdn-cgi/challenge-platform/" not in source, "Do not copy edge-injected scripts into source"
    for script in re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>", source, re.S | re.I):
        with tempfile.NamedTemporaryFile(suffix=".js", mode="w") as temp:
            temp.write(script)
            temp.flush()
            subprocess.run(["node", "--check", temp.name], check=True)
print("PASS: complete curriculum, 15 scenarios, source assets, unique IDs, JavaScript syntax")
