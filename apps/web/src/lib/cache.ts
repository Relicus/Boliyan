import { get, set, del, clear } from 'idb-keyval';

/**
 * Cache Configuration
 */
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL
const CACHE_PREFIX = 'boliyan-cache-v1-';

/**
 * Types
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheOptions {
  ttl?: number;
  namespace?: string;
  skipMemory?: boolean;
}

interface CacheResult<T> {
  data: T | null;
  isStale: boolean;
  from: 'memory' | 'disk' | 'none';
}

/**
 * L1 Memory Cache (Session only)
 */
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Generate a consistent cache key from filters/params
 */
export function generateCacheKey(namespace: string, params: Record<string, any> = {}): string {
  // Sort keys to ensure consistent order (e.g. {a:1, b:2} === {b:2, a:1})
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      const val = params[key];
      // Skip undefined/null values to keep keys clean
      if (val !== undefined && val !== null && val !== '') {
        acc[key] = val;
      }
      return acc;
    }, {} as Record<string, any>);

  return `${CACHE_PREFIX}${namespace}-${JSON.stringify(sortedParams)}`;
}

/**
 * Get data from cache (Memory -> Disk)
 */
export async function getFromCache<T>(
  key: string, 
  options: CacheOptions = {}
): Promise<CacheResult<T>> {
  const ttl = options.ttl || DEFAULT_TTL;

  // 1. Check Memory Cache (L1)
  if (!options.skipMemory && memoryCache.has(key)) {
    const entry = memoryCache.get(key) as CacheEntry<T>;
    const isStale = Date.now() - entry.timestamp > ttl;
    return { data: entry.data, isStale, from: 'memory' };
  }

  // 2. Check Disk Cache (L2)
  try {
    const entry = await get<CacheEntry<T>>(key);
    if (entry) {
      // Populate L1 for next time
      if (!options.skipMemory) {
        memoryCache.set(key, entry);
      }
      
      const isStale = Date.now() - entry.timestamp > ttl;
      return { data: entry.data, isStale, from: 'disk' };
    }
  } catch (err) {
    console.warn('[Cache] Failed to read from IndexedDB:', err);
  }

  return { data: null, isStale: true, from: 'none' };
}

/**
 * Save data to cache (Memory -> Disk)
 */
export async function setCache<T>(
  key: string, 
  data: T, 
  options: CacheOptions = {}
): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    version: '1.0'
  };

  // 1. Save to Memory (L1)
  if (!options.skipMemory) {
    memoryCache.set(key, entry);
  }

  // 2. Save to Disk (L2)
  try {
    await set(key, entry);
  } catch (err) {
    console.warn('[Cache] Failed to write to IndexedDB:', err);
  }
}

/**
 * Clear specific cache entry
 */
export async function removeCache(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    await del(key);
  } catch (err) {
    console.warn('[Cache] Failed to delete from IndexedDB:', err);
  }
}

/**
 * Clear all cache (useful for logout)
 */
export async function clearAllCache(): Promise<void> {
  memoryCache.clear();
  try {
    await clear();
  } catch (err) {
    console.warn('[Cache] Failed to clear IndexedDB:', err);
  }
}
