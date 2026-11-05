import { getIsImpersonating, getLastUsedAddress } from '../common';

// Register synchronously: the provider can be ready before storage finishes reading.
window.addEventListener('message', async (event) => {
  if (event.source !== window || !event.data || event.data.type !== 'impersonator-ready') {
    return;
  }
  const [enabled, address] = await Promise.all([getIsImpersonating(), getLastUsedAddress()]);
  if (enabled && address) {
    window.postMessage({ type: 'impersonator-start', address }, '*');
  }
});

const inject = () => {
  const container = document.head || document.documentElement;
  if (!container) {
    return false;
  }
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('static/js/inpage.js');
  script.async = false;
  script.onload = script.onerror = () => script.remove();
  container.prepend(script);
  return true;
};
if (!inject()) {
  const observer = new MutationObserver(() => {
    if (inject()) {
      observer.disconnect();
    }
  });
  observer.observe(document, { childList: true, subtree: true });
}
