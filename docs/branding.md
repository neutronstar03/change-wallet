# Branding audit

Verified on 2026-11-05 against the maintained sources and Bun build:

- Manifest name and action title: **Change Wallet**.
- Description, popup heading, page title and injection errors use Change Wallet.
- `public/logo.png` is a wallet with opposing arrows, with no TRES wordmark.
- No TRES strings remain in `src/`, `public/` or generated `dist/`.

The existing rebranding commits already implement issue #1. Retain the neutral
wallet icon; no replacement artwork is necessary. Browser loading and behavior
are recorded separately in `docs/verification.md`.
