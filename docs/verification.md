# Built extension verification

## Results — 2026-11-05

Verified the Bun-generated `dist/` on Carlino, starting from commit `8c46b84`.
`bun run check` passed: ESLint, TypeScript, four provider tests (42 assertions),
and the unpacked build. Watch rebuilt after an asset change; clean deleted only
`dist/`, and a subsequent build recreated it.

Chrome for Testing **155.0.8059.12**, Linux, temporary isolated profile:

- [x] MV3 package loads; background service worker is present.
- [x] Popup displays Change Wallet branding and the address field.
- [x] HTTP content script injects the main-world controller.
- [x] Invalid address produces a visible validation error.
- [x] Start overrides `eth_accounts`, `eth_requestAccounts` and `selectedAddress`.
- [x] Start emits `accountsChanged` when the provider supports `emit`.
- [x] Global badge becomes `ON`.
- [x] Reload resumes the address via storage and content/inpage messaging.
- [x] Stop restores the original provider account and clears the badge.
- [x] Missing provider produces a visible error and leaves saved status disabled.
- [x] Loaded metadata contains only `activeTab`, `scripting`, `storage`.
- [x] No page exceptions were observed during the successful run.

The browser exercised a tiny local HTTP page with a request-capable **test double**
provider. It did not install MetaMask or any other wallet, contact a real dApp,
use secrets, sign requests, or move funds. The test double exists only in the
external test runner, not in the extension. Compatibility with a specific wallet
version is therefore not claimed. Provider unit tests additionally exercise legacy
callbacks, forwarding, repeated Start/Stop, replacement and frozen providers.

Chrome 140 on the host loads the package and injects it, but lacks the DevTools
`Extensions.triggerAction` command needed to exercise an action-granted `activeTab`
in headless automation. A newer isolated testing browser was used to test that
permission correctly. A popup opened as a normal tab does not itself grant access.
The runner must omit Playwright's default `--disable-extensions` argument.
No product permission was broadened to accommodate the runner.

Reproduction evidence on Carlino:
`~/loop/workspace/change-wallet-verification/verify.cjs`, `results.json`, `popup.png`.
Temporary profiles are removed after each run; the shared browser is untouched.

## Short manual checklist for an existing wallet

1. Build, load `dist/` unpacked, open an HTTP(S) dApp and connect your existing wallet.
2. Open Change Wallet through its toolbar action; enter a disposable public address.
3. Start and check the dApp's account display and ON badge. Reload if the wallet
   does not expose `emit` (see [provider limitations](provider.md)).
4. Reload the page and check the same address is presented.
5. Stop, check the real wallet account returns and the badge clears.
6. On a page without a wallet, verify Start explains that a compatible provider
   is missing. On browser pages, expect Chrome's scripting restriction.

No remaining breakage was observed in the tested scope. Real-wallet/dApp-specific
quirks should be reported with browser/wallet versions, the failing discovery
method, and console output, without account secrets.
