import Redis from "ioredis";
import { env } from "./env";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 5000);
      return delay;
    },
  });

if (env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.info("Redis connected");
});

export async function connectRedis(): Promise<void> {
  await redis.ping();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}