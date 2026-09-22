#!/usr/bin/env python3
"""Publish only the public owner-guide files."""
from pathlib import Path
import shutil
import os
import re
from public_png import validate_public_pngs

root = Path(__file__).resolve().parent
validate_public_pngs(root / "assets")
output = root / "dist"
if output.exists():
    shutil.rmtree(output)
output.mkdir()
for source, target in [("index.html", "index.html"), ("guide.html", "start.html"),
                       ("_redirects", "_redirects"), ("_headers", "_headers")]:
    shutil.copy2(root / source, output / target)
shutil.copytree(root / "assets", output / "assets")
sha = os.environ.get("GITHUB_SHA", "")
if sha:
    assert re.fullmatch(r"[0-9a-f]{40}", sha), "Invalid source commit"
    with (output / "_headers").open("a") as headers:
        headers.write("\n  X-Menuconnect-Commit: " + sha + "\n")
print("Built public site in dist/")
