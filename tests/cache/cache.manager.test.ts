import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CacheManager } from '../../src/cache/cache.manager.js';

describe('CacheManager', () => {
  let cache: CacheManager<string>;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new CacheManager(1000, 3); // 1s TTL, max 3 items
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves items within TTL', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
    expect(cache.has('key1')).toBe(true);
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined();
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('expires items after TTL', () => {
    cache.set('key1', 'value1');
    vi.advanceTimersByTime(1001);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  it('evicts oldest item when exceeding maxEntries', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.set('key3', 'val3');
    expect(cache.size()).toBe(3);

    // Add 4th item, should evict key1 (the oldest)
    cache.set('key4', 'val4');
    expect(cache.size()).toBe(3);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key4')).toBe('val4');
  });

  it('updates expiration when re-setting an existing key', () => {
    cache.set('key1', 'val1');
    vi.advanceTimersByTime(500); // Wait half TTL
    cache.set('key1', 'val1-updated'); // Reset key1
    
    vi.advanceTimersByTime(600); // Total 1100ms since first set, but only 600ms since second set
    expect(cache.get('key1')).toBe('val1-updated'); // Should still be alive
  });

  it('clears all cache entries on invalidate without key', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.invalidate();
    expect(cache.size()).toBe(0);
  });

  it('clears specific entry on invalidate with key', () => {
    cache.set('key1', 'val1');
    cache.set('key2', 'val2');
    cache.invalidate('key1');
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('val2');
  });
});
