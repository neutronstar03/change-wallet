import { updateBadgeImpersonationStatus } from '../common';

// Impersonation preference is global, so the badge is global as well.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.isImpersonating) {
    void updateBadgeImpersonationStatus();
  }
});
chrome.runtime.onStartup.addListener(() => void updateBadgeImpersonationStatus());
chrome.runtime.onInstalled.addListener(() => void updateBadgeImpersonationStatus());
