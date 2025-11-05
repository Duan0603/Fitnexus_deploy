import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const WorkoutSession = sequelize.define(
  "WorkoutSession",
  {
    session_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_id: { type: DataTypes.INTEGER, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "in_progress" },
    started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ended_at: { type: DataTypes.DATE, allowNull: true },
    total_duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
    current_exercise_index: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "workout_sessions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WorkoutSession;

