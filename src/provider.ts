import type { EthereumProvider, ImpersonatorState, JsonRpcRequest, JsonRpcResponse } from './types';

const addressPattern = /^0x[\da-f]{40}$/i;

export const isWalletAddress = (value: unknown): value is string =>
  typeof value === 'string' && addressPattern.test(value);

const accountMethods = new Set(['eth_accounts', 'eth_requestAccounts']);

// Wrap only an existing provider. This does not create a wallet or sign anything.
export const createImpersonator = (getProvider: () => EthereumProvider | undefined): ImpersonatorState => {
  const undoers: (() => void)[] = [];
  let provider: EthereumProvider | undefined;
  let selectedDescriptor: PropertyDescriptor | undefined;
  let originalAddress: string | null | undefined;
  const state: ImpersonatorState = {
    startImpersonation: (address, triggerAccountsChanged) => {
      if (!isWalletAddress(address)) {
        throw new Error('Enter a valid 0x wallet address (40 hexadecimal characters).');
      }
      const candidate = getProvider();
      if (!candidate || typeof candidate.request !== 'function') {
        throw new Error('No compatible wallet provider is available on this page.');
      }
      if (provider && candidate !== provider) {
        state.stopImpersonation();
      }
      if (!provider) {
        provider = candidate;
        const wallet = candidate;
        const response = (payload: JsonRpcRequest): JsonRpcResponse => ({
          id: payload.id,
          jsonrpc: payload.jsonrpc ?? '2.0',
          result: payload.method === 'eth_coinbase' ? state.address : [state.address],
        });
        const supports = (method: string) => accountMethods.has(method) || method === 'eth_coinbase';
        try {
          const request = wallet.request;
          wallet.request = args => supports(args.method)
            ? Promise.resolve(args.method === 'eth_coinbase' ? state.address : [state.address])
            : request.call(wallet, args);
          undoers.push(() => {
            wallet.request = request;
          });
          const send = wallet.send;
          if (send) {
            wallet.send = (payload, paramsOrCallback) => {
              if (typeof payload === 'string') {
                return supports(payload) ? Promise.resolve(response({ method: payload })) : send.call(wallet, payload, paramsOrCallback);
              }
              if (supports(payload.method)) {
                const result = response(payload);
                if (typeof paramsOrCallback === 'function') {
                  paramsOrCallback(null, result);
                  return;
                }
                return result;
              }
              return send.call(wallet, payload, paramsOrCallback);
            };
            undoers.push(() => {
              wallet.send = send;
            });
          }
          const sendAsync = wallet.sendAsync;
          if (sendAsync) {
            wallet.sendAsync = (payload, callback) => {
              if (supports(payload.method)) {
                callback(null, response(payload));
                return;
              }
              return sendAsync.call(wallet, payload, callback);
            };
            undoers.push(() => {
              wallet.sendAsync = sendAsync;
            });
          }
          const enable = wallet.enable;
          if (enable) {
            wallet.enable = () => Promise.resolve([state.address]);
            undoers.push(() => {
              wallet.enable = enable;
            });
          }
          originalAddress = wallet.selectedAddress;
          selectedDescriptor = Object.getOwnPropertyDescriptor(wallet, 'selectedAddress');
          // Configurable properties can expose the current address without writing
          // through wallet-owned setters. Leave read-only nonconfigurable fields alone.
          if (!selectedDescriptor || selectedDescriptor.configurable) {
            Object.defineProperty(wallet, 'selectedAddress', { configurable: true, enumerable: selectedDescriptor?.enumerable ?? true, get: () => state.address });
            undoers.push(() => {
              if (selectedDescriptor) {
                Object.defineProperty(wallet, 'selectedAddress', selectedDescriptor);
              }
              else {
                delete wallet.selectedAddress;
              }
            });
          }
        }
        catch {
          for (const undo of undoers.reverse()) {
            undo();
          }
          undoers.length = 0;
          provider = undefined;
          throw new Error('This wallet does not allow its provider methods to be changed.');
        }
      }
      state.address = address;
      if (triggerAccountsChanged && typeof provider.emit === 'function') {
        provider.emit('accountsChanged', [address]);
      }
    },
    stopImpersonation: () => {
      if (!provider) {
        return;
      }
      const wallet = provider;
      for (const undo of undoers.reverse()) {
        undo();
      }
      undoers.length = 0;
      provider = undefined;
      delete state.address;
      const restored = wallet.selectedAddress ?? originalAddress;
      if (typeof wallet.emit === 'function') {
        wallet.emit('accountsChanged', restored ? [restored] : []);
      }
    },
  };
  return state;
};
