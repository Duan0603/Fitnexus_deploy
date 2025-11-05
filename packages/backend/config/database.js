import { Sequelize } from "sequelize";
import config from "./config.js";

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

// Khởi tạo biến sequelize
let sequelizeInstance;

if (env === "production" && process.env.DATABASE_URL) {
  // === MÔI TRƯỜNG PRODUCTION ===
  // Bỏ qua config file và dùng DATABASE_URL từ Render
  sequelizeInstance = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Bắt buộc cho Render
      },
    },
    logging: false, // Tắt log SQL trên production
  });
} else {
  // === MÔI TRƯỜNG DEVELOPMENT (hoặc khác) ===
  // Dùng cách cũ, đọc từ config file
  sequelizeInstance = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: dbConfig.dialect,
      logging: dbConfig.logging,
    }
  );
}

// Export hằng số sequelize để các file khác có thể import
export const sequelize = sequelizeInstance;

// Phần còn lại của file giữ nguyên
export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("PostgreSQL Connection has been established successfully.");
  } catch (error) {
    console.error(" Unable to connect to the database:", error);
    process.exit(1);
  }
};
