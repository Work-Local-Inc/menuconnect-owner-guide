# MenuConnect Owner Guide

Canonical shared repository: https://github.com/Work-Local-Inc/menuconnect-owner-guide

Brian has administrator access. Tim (`tim1771`) has maintainer access. Both work here.
Hosting belongs to Brian: https://app.netlify.com/projects/menuconnect-shared-guide

## Preservation and migration status

This import contains **Brian’s current live OpenAI-hosted version only**. Its two HTML
files match the source served at guide.menuconnect.ca on 2026-09-10, after removing
only the hosting provider’s injected Cloudflare challenge script. All nine image
assets were fetched from the live domain and match byte-for-byte. No changes from
the combined preview or Tim’s later version have been included.

See `BASELINE.json` for original file hashes. The preservation tag records this
baseline independently of future changes. The raw HTTP backup remains with Brian’s agent.

Migration is in progress: do not assume the custom domain has moved until the
verified deployment and domain record are recorded below.

## Editing and publishing

1. Fetch `origin` and create your own topic branch from the latest `origin/main`.
2. Change only the intended content. Never overwrite these files with an old export.
3. Run `python3 validate.py` and `python3 build.py` (Node 22 and Python 3 required).
4. Open a pull request, inspect the diff, and resolve any conflicts against current main.
5. Merge only after checks pass. Netlify builds `main`; other branches do not publish production.

Use `brian/<topic>` and `tim/<topic>` branches. Do not force-push or delete `main`.
Do not publish to Tim’s former Netlify site or the OpenAI copy. Those are rollback references.
Routine updates need GitHub access, not a personal Netlify token.

Tim’s latest changes must arrive in a separate PR based on THIS main. Port individual
changes from the old repo and review deletions. The earlier combined preview is not
the approved baseline. Keep Brian’s current work unless a later change is explicitly agreed.

## Pages

- `index.html`: the splash page, served at `/`.
- `guide.html`: the complete guide, served at `/start`.
- The original `/menuconnect`, `/guide`, and `.html` URLs redirect to the same content.
- The HTML content is preserved exactly, including existing `/guide` links; redirects handle them.

Only `dist/` is deployed. Build configuration is in `netlify.toml`. Never upload a
separate production copy manually; production is restricted to Git-based deployments.
