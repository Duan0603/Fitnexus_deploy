// packages/backend/models/login.history.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const LoginHistory = sequelize.define(
  "LoginHistory",
  {
    login_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    user_agent: { type: DataTypes.TEXT, allowNull: true },
    os: { type: DataTypes.STRING(64), allowNull: true },
    browser: { type: DataTypes.STRING(64), allowNull: true },
    device: { type: DataTypes.STRING(64), allowNull: true },
    city: { type: DataTypes.STRING(128), allowNull: true },
    country: { type: DataTypes.STRING(64), allowNull: true },
    success: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: "login_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    indexes: [
      { fields: ["user_id", "created_at"], name: "idx_login_history_user_created" },
    ],
  }
);

export default LoginHistory;

