import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheService } from './cache.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        const redisHost = process.env.REDIS_HOST || 'localhost';
        const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
        const redisPassword = process.env.REDIS_PASSWORD;
        const redisUrl = process.env.REDIS_URL;
        
        try {
          // Try to use Redis if available
          const store = await redisStore({
            socket: {
              host: redisHost,
              port: redisPort,
            },
            ...(redisPassword && { password: redisPassword }),
            ...(redisUrl && { url: redisUrl }),
          });

          return {
            store,
            ttl: 300, // Default TTL: 5 minutes (300 seconds)
          };
        } catch (error) {
          console.warn('Redis connection failed, falling back to in-memory cache:', error.message);
          // Fallback to in-memory cache if Redis is not available
          return {
            ttl: 300,
            max: 100, // Maximum number of items in cache
          };
        }
      },
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}

