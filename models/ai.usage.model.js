import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Track per-user or anonymous AI feature usage by ISO week
const AIUsage = sequelize.define(
  "AIUsage",
  {
    usage_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

    user_id: { type: DataTypes.INTEGER, allowNull: true },

    // For unauthenticated callers, store a salted hash of IP/UA
    anon_key: { type: DataTypes.STRING(128), allowNull: true },

    feature: { type: DataTypes.STRING(64), allowNull: false },

    // e.g. 2025-W44 (ISO week) or similar stable weekly key
    period_key: { type: DataTypes.STRING(16), allowNull: false },

    count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    tableName: "ai_usage",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { unique: true, fields: ["user_id", "anon_key", "feature", "period_key"], name: "uq_ai_usage_key" },
      { fields: ["feature", "period_key"], name: "idx_ai_usage_feature_period" },
      { fields: ["user_id"], name: "idx_ai_usage_user" },
    ],
  }
);

export default AIUsage;

