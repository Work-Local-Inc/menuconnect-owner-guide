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

The baseline is protected by tag `brian-live-preserved-2026-09-10`. Main requires
pull requests, passing `validate` checks, an up-to-date branch, and resolved review
conversations. Force pushes and main deletion are blocked, including for admins.
A second person's approval is not mandatory, so either person can finish routine work.

GitHub Actions builds and automatically publishes successful `main` updates to Brian's
Netlify project. PRs run checks only. The `production` environment allows protected
branches only and stores the deployment credential as an encrypted environment secret.
The publisher checks the current main commit and serializes deployments, so a stale
run cannot deploy after a newer main version. `X-Menuconnect-Commit` identifies the
published commit without changing page content.

Netlify's built-in builds do not support private organization repositories on Brian's
current plan. The direct Netlify repository connection is therefore replaced by the
GitHub publishing workflow. No plan upgrade or public repository is required. Netlify
may label these as API/manual deploys; they are automated by GitHub Actions. Do not
stop GitHub Actions or its production job when changing Netlify build settings.

### Domain routing

Cloudflare serves `guide.menuconnect.ca` by fetching Brian's Netlify origin at
`menuconnect-shared-guide.netlify.app`. The worker source is `infra/guide-router.mjs`;
its only route is `guide.menuconnect.ca/*`. The guide DNS CNAME is proxied through
Cloudflare. Site content stays on Netlify and updates automatically when main builds.
The router forwards paths and queries and keeps redirects on the guide domain.

This avoids depending on the old custom-domain registration held in another Netlify
account. Do not switch the CNAME to DNS-only while this routing arrangement is used.
Normal content updates do not require changing the worker. Worker changes require
running `node --test tests/router.test.mjs`, reviewing a PR, and deploying the exact
merged worker file to Cloudflare script `menuconnect-owner-guide-router`.

Rollback: restore the guide CNAME to `custom-domains.chatgpt.site` with proxy disabled.
The original OpenAI deployment remains intact. Only the guide record is in scope.

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
separate production copy manually. Use the protected-main GitHub publishing workflow.
