# Extension access

- `storage`: last address and the preference to resume impersonation on new pages.
- `activeTab`: temporary access to the active tab after opening the extension;
  used to inspect/start/stop the existing page provider in the main world.
- `scripting`: execute those small page functions from the popup.

Removed `tabs`: querying the active tab ID does not require permission to read
sensitive tab properties (URL/title/favicon). Removed `webNavigation`: badge
updates now follow storage changes and browser startup instead of every navigation.
The badge reflects the global resume preference, not provider availability in each tab.

Content scripts run at document start on HTTP(S), including frames, because dApps
and their wallet consumers can live on any origin or embedded frame. File URLs,
browser pages and extension pages are deliberately excluded. Only the inpage JS
bundle is web-accessible on those same origins; popup and other assets are not.
The inpage bundle must run alongside the wallet in the page's main JS world.

There are no extra `host_permissions`, network APIs, remote fonts or remote scripts.
Restricting origin matches would require an explicit dApp allowlist and would
change the current any-dApp workflow; it is not silently imposed here.
