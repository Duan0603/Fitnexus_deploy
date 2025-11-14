import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    notification_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.STRING(64), allowNull: false, defaultValue: "general" },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "notifications",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["user_id", "read_at"], name: "idx_notifications_user_read" },
      { fields: ["user_id", "created_at"], name: "idx_notifications_user_created" },
    ],
  }
);

export default Notification;
