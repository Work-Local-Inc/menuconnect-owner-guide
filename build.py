#!/usr/bin/env python3
"""Publish only the public owner-guide files."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parent
output = root / "dist"
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for source, target in [("index.html", "index.html"), ("guide.html", "start.html"),
                       ("_redirects", "_redirects"), ("_headers", "_headers")]:
    shutil.copy2(root / source, output / target)
shutil.copytree(root / "assets", output / "assets")
print("Built public site in dist/")
