# Change Wallet

Private Chrome extension for presenting a selected wallet address to dApps during local testing.

## Structure

- `src/` application sources
- `public/` runtime extension assets used for local builds and unpacked loading
- `dist/` Bun-built unpacked extension ready for Chrome `Load unpacked`
- `tooling/` local build tooling

## Build

```bash
bun install
bun run build
```

The built unpacked extension is written to `dist/`.

## Load locally

- Open `chrome://extensions`
- Enable Developer mode
- Click Load unpacked
- Select `dist/`

## Notes

- This repository is for private local testing
- Current root sources are the maintained working copy for rebuilds and personal use
- Remote Google Fonts dependencies were removed from the popup so the built extension stays fully local

## Maintenance workflow

Use Bun and the committed `bun.lock`:

```bash
bun install --frozen-lockfile
bun run check                 # lint, types, provider tests, unpacked build
bun run watch                 # rebuild src/ and public/ changes
bun run lint:fix              # apply safe ESLint fixes
bun run clean                 # delete generated dist/ only
```

Watch does not reload Chrome: reload Change Wallet in `chrome://extensions`, then
reload the dApp. Changes to the build tooling require restarting watch. Build
output is disposable and must not be committed. Keep one worker per checkout and
check `git status` before editing; use the existing branch workflow.

VS Code settings enable ESLint fixes on explicit save. Other editors can use
`bun run lint:fix`. No browser or wallet extensions are installed by these scripts.

- [Branding audit](docs/branding.md)
- [Permissions rationale](docs/permissions.md)
- [Provider behavior and limitations](docs/provider.md)
- [Browser verification](docs/verification.md)
