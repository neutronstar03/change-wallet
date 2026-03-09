# change-wallet

Private maintenance workspace for a locally recovered wallet impersonation Chrome extension originally installed as TRES Connect.

## Structure

- `src/` reconstructed application sources recovered from local sourcemaps
- `public/` runtime extension assets used for local builds and unpacked loading
- `dist/` Bun-built unpacked extension ready for Chrome `Load unpacked`
- `tooling/` local build tooling for the private maintained fork
- `origin/` archived recovery artifacts and extraction tooling

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

- This repository is for private use and reverse-engineering of a locally installed copy
- The original local extension files are preserved under `origin/`
- Current root sources are the reconstructed working copy for future cleanup, rebuilds, and personal maintenance
- Remote Google Fonts dependencies were removed from the popup so the built extension stays fully local
