// Polyfill SharedArrayBuffer BEFORE any other imports
// Required for Hermes/Metro when Remote Debugging is enabled
// Must be at the very top of the entry file
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

import 'expo-asset';
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
