import Redis from "ioredis";
import { REDIS_URL } from "../config/env.js";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableReadyCheck: true,
});
redis.on("error", (e) => console.error("[Redis] error:", e.message));
redis.on("connect", () => console.log("[Redis] connected"));
