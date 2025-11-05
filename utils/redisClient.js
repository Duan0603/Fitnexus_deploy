import Redis from "ioredis";

const url = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(url, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});
redis.on("error", (e) => console.error("[Redis] error:", e.message));
redis.on("connect", () => console.log("[Redis] connected"));