import { expect, test } from 'bun:test';
import type { EthereumProvider, JsonRpcRequest } from '../src/types';
import { createImpersonator } from '../src/provider';

const address = `0x${'1'.repeat(40)}`;
const other = `0x${'2'.repeat(40)}`;
const fixture = () => {
  const calls: string[] = [];
  const events: unknown[] = [];
  const wallet: EthereumProvider = {
    selectedAddress: null,
    async request(args) {
      expect(this).toBe(wallet);
      calls.push(args.method);
      return 'real result';
    },
    send(payload) {
      expect(this).toBe(wallet);
      calls.push(typeof payload === 'string' ? payload : payload.method);
      return { jsonrpc: '2.0', result: 'real result' };
    },
    sendAsync(payload, callback) {
      expect(this).toBe(wallet);
      calls.push(payload.method);
      callback(null, { id: payload.id, jsonrpc: '2.0', result: 'real result' });
    },
    enable: async () => [],
    emit: (event, payload) => { events.push([event, payload]); },
  };
  return { wallet, calls, events };
};

test('patches only account discovery, binds forwarding, switches and restores', async () => {
  const { wallet, calls, events } = fixture();
  const originals = { ...wallet };
  const state = createImpersonator(() => wallet);
  state.startImpersonation(address, true);
  expect(await wallet.request({ method: 'eth_accounts' })).toEqual([address]);
  expect(await wallet.request({ method: 'eth_requestAccounts' })).toEqual([address]);
  expect(await wallet.request({ method: 'eth_coinbase' })).toBe(address);
  expect(await wallet.enable?.()).toEqual([address]);
  expect(await wallet.request({ method: 'personal_sign', params: ['fake-data'] })).toBe('real result');
  expect(await wallet.send?.('eth_chainId', [])).toMatchObject({ result: 'real result' });
  state.startImpersonation(other, false);
  expect(wallet.selectedAddress).toBe(other);
  expect(await wallet.request({ method: 'eth_accounts' })).toEqual([other]);
  state.stopImpersonation();
  state.stopImpersonation();
  expect(wallet).toEqual(originals);
  expect(calls).toEqual(['personal_sign', 'eth_chainId']);
  expect(events).toEqual([['accountsChanged', [address]], ['accountsChanged', []]]);
});

test('legacy callbacks run once without contacting wallet and retain request IDs', async () => {
  const { wallet, calls } = fixture();
  createImpersonator(() => wallet).startImpersonation(address, false);
  for (const method of ['eth_accounts', 'eth_requestAccounts', 'eth_coinbase']) {
    const payload: JsonRpcRequest = { method, id: 42, jsonrpc: '2.0' };
    let responses = 0;
    const callback = (error: unknown, response: unknown) => {
      expect(error).toBeNull();
      expect(response).toEqual({ id: 42, jsonrpc: '2.0', result: method === 'eth_coinbase' ? address : [address] });
      responses++;
    };
    wallet.send?.(payload, callback);
    wallet.sendAsync?.(payload, callback);
    expect(responses).toBe(2);
    expect(await wallet.send?.(method, [])).toMatchObject({ result: method === 'eth_coinbase' ? address : [address] });
  }
  wallet.sendAsync?.({ method: 'eth_chainId' }, () => {});
  expect(calls).toEqual(['eth_chainId']);
});

test('missing, delayed, minimal and readonly providers do not create a wallet', async () => {
  let wallet: EthereumProvider | undefined;
  const state = createImpersonator(() => wallet);
  expect(() => state.startImpersonation(address, true)).toThrow('No compatible wallet');
  expect(state.address).toBeUndefined();
  wallet = { request: async () => 'real' };
  Object.defineProperty(wallet, 'selectedAddress', { value: null, configurable: false });
  state.startImpersonation(address, true);
  expect(await wallet.request({ method: 'eth_accounts' })).toEqual([address]);
  expect(wallet.selectedAddress).toBeNull();
  state.stopImpersonation();
  expect(await wallet.request({ method: 'eth_accounts' })).toBe('real');
  expect(() => state.startImpersonation('invalid', false)).toThrow('valid');
});

test('provider replacement restores the previous provider; frozen providers fail clearly', () => {
  const first = fixture().wallet;
  let wallet = first;
  const originalRequest = first.request;
  const state = createImpersonator(() => wallet);
  state.startImpersonation(address, false);
  wallet = fixture().wallet;
  state.startImpersonation(other, false);
  expect(first.request).toBe(originalRequest);
  state.stopImpersonation();
  wallet = Object.freeze(fixture().wallet);
  expect(() => state.startImpersonation(address, false)).toThrow('does not allow');
  expect(state.address).toBeUndefined();
});
