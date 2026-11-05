import type { ExtendedWindow } from './types';
import { isWalletAddress } from './provider';

declare const window: ExtendedWindow;

// badge impersonation status
const setBadgeImpersonationStatus = async (isImpersonating: boolean): Promise<void> => {
  return chrome.action.setBadgeText(
    {
      text: isImpersonating ? 'ON' : '',
    },
    () => {},
  );
};

export const updateBadgeImpersonationStatus = async (): Promise<void> => {
  return setBadgeImpersonationStatus(await getIsImpersonating());
};

// isImpersonating
export const getIsImpersonating = async (): Promise<boolean> => {
  const { isImpersonating } = await chrome.storage.local.get<{ isImpersonating?: boolean }>(
    'isImpersonating',
  );
  return isImpersonating || false;
};

export const setIsImpersonating = async (status: boolean): Promise<void> => {
  await setBadgeImpersonationStatus(status);
  return chrome.storage.local.set({ isImpersonating: status });
};

// lastUsedAddress
export const getLastUsedAddress = async (): Promise<string | undefined> => {
  const { address } = await chrome.storage.local.get<{ address?: string }>('address');
  return address;
};

export const setLastUsedAddress = async (address: string): Promise<void> => {
  return chrome.storage.local.set({ address });
};

// active tab ids
export const getActiveTabId = async (): Promise<number> => {
  const tabId = (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
  if (tabId === undefined) {
    throw new Error('No active tab is available.');
  }
  return tabId;
};

// start/stop impersonation
export const startImpersonation = async (address: string): Promise<void> => {
  if (!isWalletAddress(address)) {
    throw new Error('Enter a valid 0x wallet address.');
  }
  const [result] = await chrome.scripting.executeScript({
    func: (address: string) => {
      try {
        if (!window.impersonator) {
          return 'Change Wallet is unavailable on this page. Reload the dApp.';
        }
        window.impersonator.startImpersonation(address, true);
        return null;
      }
      catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    args: [address],
    target: { tabId: await getActiveTabId() },
    world: 'MAIN',
  });
  if (!result || result.result) {
    throw new Error(result?.result ?? 'Unable to access this page.');
  }
  await setLastUsedAddress(address);
  await setIsImpersonating(true);
};

export const stopImpersonation = async (): Promise<void> => {
  await chrome.scripting.executeScript({
    func: () => {
      window.impersonator?.stopImpersonation();
    },
    target: { tabId: await getActiveTabId() },
    world: 'MAIN',
  });
  await setIsImpersonating(false);
};

export const getImpersonationAddress = async (): Promise<string | undefined> => {
  const [{ result: address }] = await chrome.scripting.executeScript({
    func: () => {
      return window.impersonator?.address;
    },
    args: [],
    target: {
      tabId: await getActiveTabId(),
    },
    world: 'MAIN',
  });

  await setIsImpersonating(!!address);

  return address;
};
