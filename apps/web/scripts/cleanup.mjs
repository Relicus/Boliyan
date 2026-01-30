import { execSync } from 'child_process';
import os from 'os';

/**
 * Cross-platform script to kill orphan Node processes related to the project.
 * Uses taskkill on Windows and pkill/kill on Unix.
 */

function cleanup() {
  console.log('[Cleanup] Searching for leaked Node.exe processes...');

  if (os.platform() === 'win32') {
    try {
      // Find node processes using a lot of memory or likely being the dev server/playwright workers
      // We use a cautious approach to avoid killing the current process if possible, 
      // but usually simple taskkill is most effective for "clearing the deck".
      console.log('[Cleanup] Executing taskkill for node.exe...');
      execSync('taskkill /F /IM node.exe /T', { stdio: 'inherit' });
    } catch (error) {
      if (error.message.includes('not found')) {
        console.log('[Cleanup] No processes found to kill.');
      } else {
        console.error('[Cleanup] Error during taskkill:', error.message);
      }
    }
  } else {
    try {
      console.log('[Cleanup] Executing pkill for node...');
      execSync('pkill -f node', { stdio: 'inherit' });
    } catch (error) {
      console.error('[Cleanup] Error during pkill:', error.message);
    }
  }

  console.log('[Cleanup] Done.');
}

// ESM version of require.main === module check
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || 
    process.argv[1]?.endsWith('cleanup.mjs')) {
  cleanup();
}
