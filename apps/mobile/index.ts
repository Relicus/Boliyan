// Polyfill SharedArrayBuffer for Hermes/Metro Remote Debugging (dev only)
if (__DEV__) {
  (function() {
    'use strict';
    if (typeof globalThis.SharedArrayBuffer === 'undefined') {
      // @ts-ignore - polyfill SharedArrayBuffer with ArrayBuffer
      globalThis.SharedArrayBuffer = ArrayBuffer;
    }
    if (typeof global !== 'undefined' && typeof global.SharedArrayBuffer === 'undefined') {
      // @ts-ignore - also set on global for React Native
      global.SharedArrayBuffer = ArrayBuffer;
    }
  })();
}

import 'expo-asset';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
