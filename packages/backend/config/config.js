import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

// Helper to parse DATABASE_URL
const parseDatabaseUrl = (url) => {
  if (!url) return null;
  try {
    const dbUrl = new URL(url);
    return {
      username: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1),
      host: dbUrl.hostname,
      port: parseInt(dbUrl.port || "5432", 10),
      dialect: "postgres",
    };
  } catch (e) {
    console.error("Failed to parse DATABASE_URL:", e.message);
    return null;
  }
};

// For production, use DATABASE_URL if available
const productionConfig = process.env.DATABASE_URL
  ? {
      ...parseDatabaseUrl(process.env.DATABASE_URL),
      logging: false,
    }
  : {
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      dialect: "postgres",
      logging: false,
    };

export default {
  development: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: "postgres",
  },
  test: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: `${process.env.POSTGRES_DB}_test`,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: "postgres",
  },
  production: productionConfig,
};
