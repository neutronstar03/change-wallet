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
