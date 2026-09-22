# Instructions for Brian's and Tim's agents

## Start here

This is the canonical shared repository:
https://github.com/Work-Local-Inc/menuconnect-owner-guide

Brian (`brianlapp`) has administrator access. Tim (`tim1771`) has maintainer/write
access. Both can push topic branches here and merge checked pull requests.
Use an account authorized to this repository. If an agent cannot open it, check that
agent's GitHub account/app access; do not move the site or request a Netlify token.

The migration is complete. The live splash is https://guide.menuconnect.ca/ and the
owner guide is https://guide.menuconnect.ca/start. The old URLs still redirect.

## The content rule

**Brian's live version is the approved baseline.** The migration preserved his
HTML and images. Tim's latest additions were deliberately NOT included.

The protected tag `brian-live-preserved-2026-09-10` and `BASELINE.json` record that
original version for recovery. Do not move the tag or rewrite its historical hashes.
The earlier combined preview is not the approved baseline.

For Tim's first update, start from this repository's latest main. Compare Tim's
old working copy with it and port only the intended additions or fixes. Review every
removed section and changed instruction. Do not replace entire pages with an old
export, merge the old repository wholesale, or discard Brian's changes to resolve
conflicts. Flag any disputed content in the PR instead of silently replacing it.

## Normal update workflow

1. Preserve any uncommitted local work. Fetch this repository's current `origin/main`.
2. Create a new topic branch from `origin/main`: `tim/<topic>` or `brian/<topic>`.
3. Edit `index.html` (splash), `guide.html` (guide), or the relevant `assets/` files.
4. Run these checks with Node 22 and Python 3:

   ```sh
   python3 validate.py
   node --test tests/*.test.mjs
   python3 build.py
   git diff --check
   ```

5. Inspect the diff against current main, especially deletions. Push the topic branch
   and open a PR targeting main. Explain the intended content change and checks run.
6. If main advances, merge current main into your topic branch, resolve conflicts
   deliberately, and rerun checks. No force push is needed.
7. Merge only after the required checks pass and review conversations are resolved.
   A second person's approval is not required for routine work; each agent must still
   review its proposed changes. Main blocks direct/force pushes and deletion.
8. Watch the **Guide checks and publishing** GitHub Actions run for the merged commit.
   Confirm both `validate` and `publish` succeed, then check the affected live page.
   The response header `X-Menuconnect-Commit` should identify that merged main commit.
   A superseded run can skip publishing; verify the newer main run in that case.

## Publishing: already automatic

GitHub Actions builds successful main updates and publishes them to **Brian's**
Netlify project `menuconnect-shared-guide`. Its encrypted production credential is
already configured. PR runs cannot access it or publish production. Routine edits
require only GitHub access; no token exchange or manual upload is needed.

Netlify's built-in Git builds are NOT the publishing mechanism. They do not support
this private organization repo on the current Netlify plan. Netlify may label the
resulting uploads API/manual, but GitHub Actions publishes them automatically.
Do not enable native Git builds, pause the GitHub workflow, or replace the connection.

Cloudflare routes only `guide.menuconnect.ca/*` to Brian's Netlify origin. Leave DNS,
the Cloudflare router, production secrets, and hosting settings alone for content
updates. The guide CNAME must remain proxied. Do not point it at Tim's old Netlify site.
The router contains no guide content, so it needs no deployment for ordinary edits.
See README.md for infrastructure details and the documented rollback.

## Reporting

Share the PR link and, after publishing, the successful Actions run and live page.
Do not call a change live just because it was committed, pushed, or uploaded.
For a failed publish, inspect the failed job and fix it through a PR; do not publish
an older copy manually. The last successful production deployment remains available.
