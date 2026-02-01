import {
  NativeBridgeGlobalName,
  NativeBridgeMethod,
  NativeBridgeReadyFlag,
  type NativeBridgeError,
  type NativeBridgeMethod as NativeBridgeMethodType,
  type NativeBridgeRequest,
  type NativeBridgeResponse,
  type NativeBridgeResultMap
} from '../../../packages/shared/nativeBridge';
import { BRIDGE_RESPONSE_TIMEOUT_MS } from './constants';

export const BRIDGE_METHODS = Object.values(NativeBridgeMethod);

export function createBridgeScript(): string {
  const methodsJson = JSON.stringify(BRIDGE_METHODS);
  const globalName = NativeBridgeGlobalName;
  const readyFlag = NativeBridgeReadyFlag;
  const timeoutMs = BRIDGE_RESPONSE_TIMEOUT_MS;

  return `(() => {
  // Forward console logs to Native
  const levels = ['log', 'warn', 'error', 'info', 'debug'];
  levels.forEach(level => {
    const original = console[level];
    console[level] = (...args) => {
      original(...args);
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CONSOLE_LOG',
            level,
            args: args.map(arg => {
              if (typeof arg === 'object') {
                try { return JSON.stringify(arg); } catch(e) { return String(arg); }
              }
              return String(arg);
            })
          }));
        }
      } catch (e) {}
    };
  });

  if (window.${globalName}) {
    return;
  }
  const pending = new Map();
  const request = (type, payload) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2);
    const message = JSON.stringify({ id, type, payload });
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(message);
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('timeout'));
      }, ${timeoutMs});
      pending.set(id, { resolve, reject, timer });
    });
  };
  const methods = ${methodsJson};
  const api = {};
  methods.forEach((method) => {
    api[method] = (payload) => request(method, payload);
  });
  const handleMessage = (event) => {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (!data || !data.id) {
        return;
      }
      const pendingRequest = pending.get(data.id);
      if (!pendingRequest) {
        return;
      }
      clearTimeout(pendingRequest.timer);
      pending.delete(data.id);
      if (data.ok) {
        pendingRequest.resolve(data.data);
      } else {
        const error = new Error((data.error && data.error.message) || 'Native error');
        pendingRequest.reject(error);
      }
    } catch (err) {
      return;
    }
  };
  window.addEventListener('message', handleMessage);
  document.addEventListener('message', handleMessage);
  window.${globalName} = api;
  window.${readyFlag} = true;
})();`;
}

export function parseBridgeRequest(raw: string): NativeBridgeRequest | null {
  try {
    const parsed = JSON.parse(raw) as NativeBridgeRequest;
    if (!parsed || typeof parsed.id !== 'string' || typeof parsed.type !== 'string') {
      return null;
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

export function buildSuccessResponse<T extends NativeBridgeMethodType>(
  request: NativeBridgeRequest<T>,
  data: NativeBridgeResultMap[T]
): NativeBridgeResponse<T> {
  return {
    id: request.id,
    type: request.type,
    ok: true,
    data
  };
}

export function buildErrorResponse<T extends NativeBridgeMethodType>(
  request: NativeBridgeRequest<T>,
  error: NativeBridgeError
): NativeBridgeResponse<T> {
  return {
    id: request.id,
    type: request.type,
    ok: false,
    error
  };
}
