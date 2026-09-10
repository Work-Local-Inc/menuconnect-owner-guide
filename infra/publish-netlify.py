#!/usr/bin/env python3
"""Publish only protected main, with serialized production jobs and stale-run rejection."""
import io
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

root = Path(__file__).resolve().parents[1]
sha = os.environ["GITHUB_SHA"]
assert os.environ["GITHUB_REF"] == "refs/heads/main", "Only main may publish"
assert os.environ["GITHUB_EVENT_NAME"] == "push", "Only a main push may publish"
assert subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip() == sha
latest = subprocess.check_output(["git", "ls-remote", "origin", "refs/heads/main"], cwd=root, text=True).split()[0]
if latest != sha:
    print("Skipping superseded commit; the newer main run will publish.")
    raise SystemExit(0)
token = os.environ.pop("NETLIFY_AUTH_TOKEN")
site_id = os.environ["NETLIFY_SITE_ID"]
api = "https://api.netlify.com/api/v1"

def request(path, method="GET", data=None):
    req = urllib.request.Request(api + path, data=data, method=method,
        headers={"Authorization": "Bearer " + token, "Content-Type": "application/zip"})
    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"Netlify API returned HTTP {error.code}") from None

archive = io.BytesIO()
with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as bundle:
    for path in sorted((root / "dist").rglob("*")):
        if path.is_file():
            bundle.write(path, path.relative_to(root / "dist").as_posix())
query = urllib.parse.urlencode({"draft": "false", "title": "GitHub main " + sha, "branch": "main"})
deploy = request(f"/sites/{site_id}/deploys?{query}", "POST", archive.getvalue())
print("Created Netlify deployment", deploy["id"], "for", sha)
for attempt in range(60):
    current = request("/deploys/" + deploy["id"])
    if current["state"] == "ready":
        published = request("/sites/" + site_id).get("published_deploy") or {}
        assert published.get("id") == deploy["id"], "Deploy was not published to production"
        print("Published and verified", deploy["id"], "for", sha)
        break
    if current["state"] == "error":
        raise RuntimeError("Netlify deployment failed; inspect its deployment log")
    time.sleep(5)
else:
    raise RuntimeError("Timed out waiting for Netlify deployment")
