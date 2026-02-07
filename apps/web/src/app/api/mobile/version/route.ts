import { NextResponse } from 'next/server';

/**
 * Mobile version check endpoint.
 * 
 * The mobile wrapper polls this to determine if an update is needed.
 * Adjust MIN_VERSION to force-block old clients.
 * Adjust LATEST_VERSION to soft-prompt users to update.
 */

const MIN_VERSION = '1.0.0';
const LATEST_VERSION = '1.0.0';

const IOS_STORE_URL = 'https://apps.apple.com/app/boliyan/id0000000000';
const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.boliyan.app';

export async function GET(request: Request) {
  const userAgent = request.headers.get('user-agent') ?? '';
  const isIos = /iphone|ipad/i.test(userAgent);
  const updateUrl = isIos ? IOS_STORE_URL : ANDROID_STORE_URL;

  return NextResponse.json({
    minVersion: MIN_VERSION,
    latestVersion: LATEST_VERSION,
    updateUrl
  });
}
