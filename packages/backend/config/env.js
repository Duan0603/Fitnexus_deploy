import dotenv from "dotenv";

dotenv.config();

const warnFallback = (key, fallback) => {
  console.warn(`[ENV] ${key} is missing. Using fallback "${fallback}".`);
  return fallback;
};

const getEnv = (key, { fallback = null } = {}) => {
  const value = process.env[key];
  if (value != null && String(value).trim() !== "") {
    return String(value).trim();
  }
  if (fallback != null) {
    return warnFallback(key, fallback);
  }
  console.warn(`[ENV] ${key} is missing and no fallback provided.`);
  return "";
};

export const FRONTEND_URL = getEnv("FRONTEND_URL", {
  fallback: "http://localhost:5173",
});
export const BACKEND_URL = getEnv("BACKEND_URL", {
  fallback: "http://localhost:3001",
});

const sanitizedFrontend = FRONTEND_URL.replace(/\/$/, "");
export const FRONTEND_RESET_URL = getEnv("FRONTEND_RESET_URL", {
  fallback: `${sanitizedFrontend}/reset-password`,
});
export const AI_API_URL = getEnv("AI_API_URL", {
  fallback: "http://127.0.0.1:8000/analyze-image/",
});
export const ADDITIONAL_CORS_ORIGINS = getEnv("ADDITIONAL_CORS_ORIGINS", {
  fallback: "",
});

export const REDIS_URL = (() => {
  const direct = process.env.REDIS_URL;
  if (direct && String(direct).trim() !== "") {
    return String(direct).trim();
  }

  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT;
  if (
    host &&
    port &&
    String(host).trim() !== "" &&
    String(port).trim() !== ""
  ) {
    return `redis://${String(host).trim()}:${String(port).trim()}`;
  }

  return warnFallback("REDIS_URL", "redis://localhost:6379");
})();
