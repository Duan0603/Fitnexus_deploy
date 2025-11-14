import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BugReport = sequelize.define(
  "BugReport",
  {
    report_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    contact_email: { type: DataTypes.STRING(255), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    steps: { type: DataTypes.TEXT, allowNull: true },
    severity: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "medium" },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: "open" },
    screenshot_url: { type: DataTypes.TEXT, allowNull: true },
    admin_response: { type: DataTypes.TEXT, allowNull: true },
    responded_by: { type: DataTypes.INTEGER, allowNull: true },
    responded_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "bug_reports",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["status"], name: "idx_bug_reports_status" },
      { fields: ["severity"], name: "idx_bug_reports_severity" },
      { fields: ["user_id"], name: "idx_bug_reports_user" },
      { fields: ["created_at"], name: "idx_bug_reports_created" },
    ],
  }
);

export default BugReport;
