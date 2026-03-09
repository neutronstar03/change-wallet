export type JsonRpcCallback = (
  error: unknown,
  response: JsonRpcResponse,
) => void;

export type JsonRpcRequest = {
  id?: string | number;
  jsonrpc?: string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
  [key: string]: unknown;
};

export type JsonRpcResponse = {
  id?: string | number;
  jsonrpc: string;
  method?: string;
  result?: unknown;
  error?: unknown;
  [key: string]: unknown;
};

export type ImpersonatorState = {
  address?: string;
  originalAddress?: string;
  mockedFunctionsUndoers: Record<string, () => void>;
  startImpersonation: (address: string, triggerAccountsChanged: boolean) => void;
  stopImpersonation: () => void;
};

export type EthereumProvider = {
  request: (args: { method: string; [key: string]: unknown }) => Promise<unknown>;
  send?: (
    methodOrPayload: string | JsonRpcRequest,
    paramsOrCallback: unknown[] | JsonRpcCallback,
  ) => Promise<JsonRpcResponse> | void;
  sendAsync?: (payload: JsonRpcRequest, callback: JsonRpcCallback) => void;
  enable?: () => Promise<unknown>;
  emit: (event: string, payload: unknown) => void;
  selectedAddress?: string;
  [key: string]: unknown;
};

export type ExtendedWindow = Window & {
  ethereum: EthereumProvider;
  impersonator?: ImpersonatorState;
};
