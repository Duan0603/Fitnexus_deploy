import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
// Table: user_workout_logs (no created_at/updated_at; has started_at/completed_at)
const UserWorkoutLog = sequelize.define(
  "UserWorkoutLog",
  {
    log_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_id: { type: DataTypes.INTEGER, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "user_workout_logs",
    timestamps: false,
  }
);
export default UserWorkoutLog;