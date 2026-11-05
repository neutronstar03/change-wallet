import type { ExtendedWindow } from '../types';
import { createImpersonator, isWalletAddress } from '../provider';

declare const window: ExtendedWindow;

if (!window.impersonator) {
  window.impersonator = createImpersonator(() => window.ethereum);
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || typeof event.data !== 'object') {
      return;
    }
    if (event.data.type === 'impersonator-start' && isWalletAddress(event.data.address)) {
      try {
        window.impersonator?.startImpersonation(event.data.address, false);
      }
      catch (error) {
        console.warn('Change Wallet could not resume impersonation.', error);
      }
    }
  });
  const ready = () => window.postMessage({ type: 'impersonator-ready' }, '*');
  if (window.ethereum) {
    ready();
  }
  window.addEventListener('ethereum#initialized', ready);
}
