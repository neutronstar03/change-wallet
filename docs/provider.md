# Existing wallet impersonation

Change Wallet wraps `window.ethereum` only. Connect the wallet you already use;
no wallet, private key, signing ability or account balance is created here.

Patched account discovery:

- `request`: `eth_accounts`, `eth_requestAccounts`, `eth_coinbase`.
- `send(method, params)`: same methods as JSON-RPC response promises.
- `send(payload, callback)` and `sendAsync`: same methods, one callback with the
  original request ID; no fall-through to the real wallet.
- Legacy synchronous `send(payload)` returns the account JSON-RPC response.
- `enable()` returns an address array.
- Configurable `selectedAddress` exposes the current override and is restored
  with its original property descriptor on Stop. Nonconfigurable fields remain
  wallet-owned and may continue reporting the real account.

Other calls retain their parameters and provider `this` binding. Signing,
transactions and network selection continue to use the real wallet. An overridden
account must never be interpreted as authority to sign for that account.

Start validates the address and requires an existing request-capable provider.
A late provider can announce `ethereum#initialized`; otherwise retry Start once
it is connected. Stop restores wrappers; replacing `window.ethereum` and starting
again first restores the old provider. Frozen providers fail with a visible error.
Repeated Start updates the address without stacking wrappers.

`accountsChanged` is emitted on Start/Stop only when the wallet exposes an emitter;
EIP-1193 does not require `emit`. For other wallets, reload the dApp so it reads the
overridden account. Incoming wallet events are not intercepted: a real account
switch can make a dApp refresh its state. Stop emits `[]` for a disconnected wallet.
The global badge reflects the saved resume preference, not proof of a provider.

Scope limits: this does not enumerate EIP-6963 wallets, wrap providers stored by a
dApp before injection, or cover non-EVM wallets. HTTP(S) injection can be blocked
by a site's CSP. Browser/extension pages are not supported. The same-page message
bridge is not an authentication boundary; its only effect is account presentation.
