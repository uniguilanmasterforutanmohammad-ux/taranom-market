import { createClient } from "redis";

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as { redisPromise?: Promise<RedisClient | null> };

export async function getRedis(): Promise<RedisClient | null> {
  if (!process.env.REDIS_URL) return null;
  if (!globalForRedis.redisPromise) {
    globalForRedis.redisPromise = (async () => {
      try {
        const client = createClient({
          url: process.env.REDIS_URL,
          socket: { connectTimeout: 700, reconnectStrategy: false },
        }) as RedisClient;
        client.on("error", () => {});
        await client.connect();
        return client;
      } catch {
        return null;
      }
    })();
  }
  return (await globalForRedis.redisPromise) ?? null;
}

export async function cacheJson<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const redis = await getRedis();
  if (!redis) return loader();
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch {
    return loader();
  }
  const value = await loader();
  try {
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    /* cache is best-effort */
  }
  return value;
}

export async function invalidateCache(prefix: string): Promise<void> {
  const redis = await getRedis();
  if (!redis) return;
  try {
    for await (const key of redis.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      await redis.del(key);
    }
  } catch {
    /* cache is best-effort */
  }
}
