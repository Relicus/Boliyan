# Boliyan Mobile Wrapper

Web-first Expo wrapper for Boliyan. The WebView hosts the full web app while native services are provided via a JS bridge.

## Quickstart

```
npm install
npm run start
```

`npm run start` uses LAN by default so physical devices can connect.

## Environment

Set these variables before running or building:

- `EXPO_PUBLIC_WEB_ORIGIN` (default: https://boliyan.pk)
- `EXPO_PUBLIC_LINK_SCHEME` (default: boliyan)
- `EXPO_EAS_PROJECT_ID` (required for push tokens)

## EAS

Set `EXPO_EAS_PROJECT_ID` (or `EXPO_PUBLIC_EAS_PROJECT_ID`) before running `eas build`.
