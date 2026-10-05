# Instructions for Brian's and Tim's agents

## Start here

This is the canonical shared repository:
https://github.com/Work-Local-Inc/menuconnect-owner-guide

Brian (`brianlapp`) has administrator access. Tim (`tim1771`) has maintainer/write
access. Both can push topic branches here and merge checked pull requests.
Use an account authorized to this repository. If an agent cannot open it, check that
agent's GitHub account/app access; do not move the site or request a hosting token.

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
8. Merging to `main` deploys automatically within a few minutes. Then check the affected
   live page. The response header `X-Menuconnect-Commit` identifies the deployed main
   commit; if it is missing, compare the live page with a local `python3 build.py` of main.

## Publishing: automatic from main

The hosting is connected to this repository and deploys `main` automatically. Agents only
commit to topic branches and merge checked pull requests. No hosting account, deploy
token or manual upload is needed, and agents should not set any of those up.

Cloudflare routes only `guide.menuconnect.ca/*` to the hosting origin. Leave DNS,
the Cloudflare router and hosting settings alone for content updates. The guide CNAME
must remain proxied. Do not point it at Tim's old Netlify site.
The router contains no guide content, so it needs no deployment for ordinary edits.
See README.md for infrastructure details and the documented rollback.

## Reporting

Share the PR link and, after the deploy, the live page. Do not call a change live just
because it was committed or merged; check the live page first. If a deploy does not
appear, tell Brian rather than publishing a copy manually. The last successful deployment
remains available.

## Shared site: two teams, one repo (Brian, 2026-10-05)
- This org repo (Work-Local-Inc/menuconnect-owner-guide) is the ONE source for guide.menuconnect.ca. Netlify rebuilds the whole site from `main` on every merge. Tim's old personal repo is retired: never publish from it.
- Menu Brian's pages live in `menu-brian/` (served at /menu-ottawa/, /brand-guide/, /plan, /emails). build.py copies them into dist/. Never delete, rename or edit `menu-brian/`, and keep that copy line in build.py. Menu Brian's agent changes them only through PRs to this repo.
- The guide's own files (index.html, guide.html -> /start.html, assets/, _redirects, _headers) are the guide agent's to change.
- Never upload to Netlify directly: a direct upload is wiped by the next merge (that is what removed Menu Brian's pages on 2026-10-05).
