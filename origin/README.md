# Origin

This directory keeps the original recovery artifacts for the private `change-wallet` extension work.

- Local source extension: Chrome extension ID `dcncbippcdfiljhcfpdieipdjfjoaihl`
- Recovery source of truth: local Chrome profile files only
- Recovered from: `Extensions\dcncbippcdfiljhcfpdieipdjfjoaihl`
- On-disk recovered manifest reports `1.0`, even though Chrome previously displayed `2.0.1`
- `recovered-extension/` contains the copied unpacked extension, hashes, inventory, and archive ZIP
- `scripts/` contains the Bun extraction tooling used to reconstruct readable sources from local sourcemaps
- `reconstruction-meta/` contains the extraction manifest for traceability

This material is kept for provenance, comparison, and private maintenance.
