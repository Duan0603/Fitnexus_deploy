import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const WorkoutSessionSet = sequelize.define(
  "WorkoutSessionSet",
  {
    set_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    session_exercise_id: { type: DataTypes.INTEGER, allowNull: false },
    set_index: { type: DataTypes.INTEGER, allowNull: false },
    actual_reps: { type: DataTypes.INTEGER, allowNull: true },
    actual_weight_kg: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    rest_seconds: { type: DataTypes.INTEGER, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "workout_session_sets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WorkoutSessionSet;

