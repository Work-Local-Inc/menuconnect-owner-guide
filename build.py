#!/usr/bin/env python3
"""Publish only the public owner-guide files."""
from pathlib import Path
import shutil
import hashlib
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
# Menu Brian's pages (menu-ottawa, brand-guide, plan, emails) are part of this site too. This org repo is the
# ONE source for both teams; never delete menu-brian/ (Brian 2026-10-05).
shutil.copytree(root / "menu-brian", output, dirs_exist_ok=True)
# The hosting build sets COMMIT_REF; GitHub Actions sets GITHUB_SHA.
# Version the script URLs by content so browsers fetch a changed file immediately
# instead of reusing a cached copy (assets are cacheable for hours). Source pages keep
# the plain /assets/ paths; only the built copies in dist/ get ?v=<hash>.
def versioned(match):
    path = match.group(2)
    digest = hashlib.sha256((root / path.lstrip("/")).read_bytes()).hexdigest()[:12]
    return f'{match.group(1)}{path}?v={digest}"'
for page in ("index.html", "start.html"):
    built = output / page
    html = built.read_text()
    html = re.sub(r'(<script[^>]*\ssrc=")(/assets/[A-Za-z0-9_./-]+\.js)"', versioned, html)
    built.write_text(html)

sha = os.environ.get("COMMIT_REF") or os.environ.get("GITHUB_SHA", "")
if sha:
    assert re.fullmatch(r"[0-9a-f]{40}", sha), "Invalid source commit"
    with (output / "_headers").open("a") as headers:
        headers.write("\n  X-Menuconnect-Commit: " + sha + "\n")
print("Built public site in dist/")
