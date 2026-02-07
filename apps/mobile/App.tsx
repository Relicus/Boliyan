import { StatusBar } from 'expo-status-bar';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_WEB_PATH,
  LINK_PREFIX,
  GOOGLE_AUTH_REDIRECT_PATH,
  ORIGIN_WHITELIST,
  WEB_ORIGIN,
  WEBVIEW_ERROR_THRESHOLD_MS
} from './src/constants';
import { createBridgeScript, parseBridgeRequest } from './src/bridge';
import { handleBridgeRequest } from './src/bridgeHandlers';
import { ErrorScreen } from './src/screens/ErrorScreen';
import { LoadingScreen } from './src/screens/LoadingScreen';
import { OfflineScreen } from './src/screens/OfflineScreen';
import { UpdateScreen } from './src/screens/UpdateScreen';
import { useVersionCheck } from './src/hooks/useVersionCheck';

const INTERNAL_SCHEME_PREFIX = LINK_PREFIX;

function buildWebUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${WEB_ORIGIN}${normalizedPath}`;
}

function extractPathFromUrl(rawUrl: string): string {
  if (rawUrl.startsWith(INTERNAL_SCHEME_PREFIX)) {
    return rawUrl.replace(INTERNAL_SCHEME_PREFIX, '/');
  }

  try {
    const url = new URL(rawUrl);
    if (url.origin === WEB_ORIGIN) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch (err) {
    return DEFAULT_WEB_PATH;
  }

  return DEFAULT_WEB_PATH;
}

function isInternalUrl(url: string): boolean {
  return url.startsWith(WEB_ORIGIN) || url.startsWith(INTERNAL_SCHEME_PREFIX);
}

function isAuthSessionRedirect(url: string): boolean {
  return url.startsWith(`${LINK_PREFIX}${GOOGLE_AUTH_REDIRECT_PATH}`);
}

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [webUrl, setWebUrl] = useState(buildWebUrl(DEFAULT_WEB_PATH));
  const [isOnline, setIsOnline] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWebViewAtTop, setIsWebViewAtTop] = useState(true);
  const [loadStartAt, setLoadStartAt] = useState<number | null>(null);
  const bridgeScript = useMemo(createBridgeScript, []);
  const userAgent = Platform.OS === 'ios' ? undefined : 'BoliyanMobile';

  // Version gating
  const { needsForceUpdate, needsSoftUpdate, updateUrl, dismiss: dismissUpdate } = useVersionCheck();

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    webViewRef.current?.reload();
  }, []);

  const handleDeepLink = useCallback(
    (url: string) => {
      if (isAuthSessionRedirect(url)) {
        return;
      }
      const path = extractPathFromUrl(url);
      const nextUrl = buildWebUrl(path);
      setWebUrl(nextUrl);
      webViewRef.current?.stopLoading();
      webViewRef.current?.injectJavaScript(
        `window.location.href = ${JSON.stringify(nextUrl)}; true;`
      );
    },
    []
  );

  useEffect(() => {
    const subscription = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(Boolean(state.isConnected));
    });

    return () => subscription();
  }, []);

  useEffect(() => {
    const init = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleDeepLink(initialUrl);
      }
    };

    const listener = Linking.addEventListener('url', (event: { url: string }) => {
      if (event.url) {
        handleDeepLink(event.url);
      }
    });

    init();

    return () => listener.remove();
  }, [handleDeepLink]);

  const handleMessage = useCallback(async (event: { nativeEvent: { data: string } }) => {
    // Check if it's a console log message first
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data && data.type === 'CONSOLE_LOG') {
        const prefix = `[WebView:${data.level}]`;
        const args = data.args || [];
        console.log(prefix, ...args);
        return;
      }
    } catch (e) {
      console.log('[App] Received raw message:', event.nativeEvent.data);
    }
    
    // Process as bridge request
    const request = parseBridgeRequest(event.nativeEvent.data);
    if (!request) {
      // Invalid request and not a console log - ignore
      return;
    }

    console.log('[App] Processing bridge request:', request.type);
    const response = await handleBridgeRequest(request);
    console.log('[App] Sending response back to WebView:', response);
    webViewRef.current?.postMessage(JSON.stringify(response));
  }, []);

  const handleWebViewError = useCallback(() => {
    setHasError(true);
  }, []);

  const handleLoadStart = useCallback(() => {
    setLoadStartAt(Date.now());
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    setIsRefreshing(false);
  }, []);

  const handleWebViewScroll = useCallback((event: { nativeEvent: { contentOffset: { y: number } } }) => {
    const offsetY = event.nativeEvent.contentOffset?.y ?? 0;
    setIsWebViewAtTop(offsetY <= 0);
  }, []);

  const handleNativeRefresh = useCallback(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    setHasError(false);
    setIsLoaded(false);
    setIsRefreshing(true);
    webViewRef.current?.reload();
  }, []);

  const handleShouldStart = useCallback((request: { url: string }) => {
    if (isInternalUrl(request.url)) {
      return true;
    }

    Linking.openURL(request.url).catch(() => undefined);
    return false;
  }, []);

  useEffect(() => {
    if (!loadStartAt || isLoaded) {
      return;
    }

    const timeout = setTimeout(() => {
      setHasError(true);
    }, WEBVIEW_ERROR_THRESHOLD_MS);

    return () => clearTimeout(timeout);
  }, [isLoaded, loadStartAt]);

  // Screen priority: offline > force update > error > soft update > app
  if (!isOnline) {
    return <OfflineScreen onRetry={handleRetry} />;
  }

  if (needsForceUpdate) {
    return <UpdateScreen isForced updateUrl={updateUrl} onDismiss={dismissUpdate} />;
  }

  if (hasError) {
    return <ErrorScreen onRetry={handleRetry} />;
  }

  if (needsSoftUpdate) {
    return <UpdateScreen isForced={false} updateUrl={updateUrl} onDismiss={dismissUpdate} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView nativeID="mobile-app-root" style={styles.container}>
        <StatusBar style="light" />
        {!isLoaded && <LoadingScreen />}
        {Platform.OS === 'android' ? (
          <ScrollView
            contentContainerStyle={styles.webViewContainer}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleNativeRefresh}
                tintColor="#f4f4f4"
                enabled={isWebViewAtTop}
              />
            }
            scrollEnabled={false}
          >
            <WebView
              ref={webViewRef}
              nativeID="mobile-webview"
              source={{ uri: webUrl }}
              onMessage={handleMessage}
              injectedJavaScriptBeforeContentLoaded={bridgeScript}
              originWhitelist={ORIGIN_WHITELIST}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onShouldStartLoadWithRequest={handleShouldStart}
              onScroll={handleWebViewScroll}
              sharedCookiesEnabled
              allowsInlineMediaPlayback
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction
              userAgent={userAgent}
              // WebView caching — keep pages cached for faster back/forward
              cacheEnabled
              cacheMode="LOAD_DEFAULT"
              incognito={false}
            />
          </ScrollView>
        ) : (
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              nativeID="mobile-webview"
              source={{ uri: webUrl }}
              onMessage={handleMessage}
              injectedJavaScriptBeforeContentLoaded={bridgeScript}
              originWhitelist={ORIGIN_WHITELIST}
              onError={handleWebViewError}
              onHttpError={handleWebViewError}
              onLoadStart={handleLoadStart}
              onLoadEnd={handleLoadEnd}
              onShouldStartLoadWithRequest={handleShouldStart}
              sharedCookiesEnabled
              allowsInlineMediaPlayback
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction
              userAgent={userAgent}
              // WebView caching — keep pages cached for faster back/forward
              cacheEnabled
              cacheMode="LOAD_DEFAULT"
              incognito={false}
            />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0b'
  },
  webViewContainer: {
    flex: 1
  }
});
