import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * Delete all keys matching a pattern (for cache invalidation)
   * Note: Pattern matching only works with Redis store, not in-memory cache
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Check if stores array exists and has a store with keys method (Redis does, in-memory doesn't)
      const stores = (this.cacheManager as any).stores;
      if (stores && Array.isArray(stores) && stores.length > 0) {
        const store = stores[0];
        if (store && typeof store.keys === 'function') {
          const keys = await store.keys(pattern);
          if (keys && keys.length > 0) {
            await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
          }
        }
      }
    } catch (error: any) {
      // Silently fail if pattern matching is not supported (e.g., in-memory cache)
      console.warn('Pattern-based cache invalidation not supported:', error?.message || 'Unknown error');
    }
  }

  /**
   * Reset entire cache
   * Note: This may not be available in all cache implementations
   */
  async reset(): Promise<void> {
    try {
      // Try to reset if the method exists
      if (typeof (this.cacheManager as any).reset === 'function') {
        await (this.cacheManager as any).reset();
      }
    } catch (error) {
      // Silently fail if reset is not supported
      console.warn('Cache reset not supported');
    }
  }

  /**
   * Generate cache key for offers
   */
  getOfferKey(page?: number, limit?: number): string {
    if (page && limit) {
      return `offers:page:${page}:limit:${limit}`;
    }
    return 'offers:all';
  }

  /**
   * Generate cache key for offers by owner
   */
  getOffersByOwnerKey(ownerId: number): string {
    return `offers:owner:${ownerId}`;
  }

  /**
   * Generate cache key for orders
   */
  getOrderKey(id?: number): string {
    return id ? `order:${id}` : 'orders:all';
  }

  /**
   * Generate cache key for orders by user
   */
  getOrdersByUserKey(userId: number): string {
    return `orders:user:${userId}`;
  }

  /**
   * Generate cache key for orders by provider
   */
  getOrdersByProviderKey(providerId: number): string {
    return `orders:provider:${providerId}`;
  }

  /**
   * Generate cache key for orders by offer
   */
  getOrdersByOfferKey(offerId: number): string {
    return `orders:offer:${offerId}`;
  }

  /**
   * Generate cache key for users
   */
  getUserKey(id?: number, email?: string): string {
    if (id) return `user:id:${id}`;
    if (email) return `user:email:${email}`;
    return 'users:all';
  }

  /**
   * Invalidate all offer-related cache
   */
  async invalidateOffers(offerId?: number): Promise<void> {
    // Invalidate all offers list and paginated results
    await this.del(this.getOfferKey());
    await this.delPattern('offers:page:*');
    // Invalidate all owner-specific caches (pattern matching)
    await this.delPattern('offers:owner:*');
    // Invalidate specific offer if provided
    if (offerId) {
      await this.del(`offer:${offerId}`);
    }
  }

  /**
   * Invalidate all order-related cache
   */
  async invalidateOrders(orderId?: number, userId?: number, offerId?: number, providerId?: number): Promise<void> {
    const deletions: Promise<void>[] = [];
    
    if (orderId) {
      deletions.push(this.del(this.getOrderKey(orderId)));
    }
    if (userId) {
      deletions.push(this.del(this.getOrdersByUserKey(userId)));
    }
    if (offerId) {
      deletions.push(this.del(this.getOrdersByOfferKey(offerId)));
    }
    if (providerId) {
      deletions.push(this.del(this.getOrdersByProviderKey(providerId)));
    }
    // Invalidate all orders list
    deletions.push(this.del(this.getOrderKey()));
    
    // Execute all deletions in parallel
    await Promise.all(deletions);
  }

  /**
   * Invalidate all user-related cache
   */
  async invalidateUsers(userId?: number, email?: string): Promise<void> {
    if (userId) {
      await this.del(this.getUserKey(userId));
    }
    if (email) {
      await this.del(this.getUserKey(undefined, email));
    }
    // Invalidate all users list
    await this.del(this.getUserKey());
    await this.delPattern('users:providers');
  }
}

