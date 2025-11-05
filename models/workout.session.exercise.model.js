import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const WorkoutSessionExercise = sequelize.define(
  "WorkoutSessionExercise",
  {
    session_exercise_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    session_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_exercise_id: { type: DataTypes.INTEGER, allowNull: true },
    exercise_id: { type: DataTypes.INTEGER, allowNull: false },
    session_order: { type: DataTypes.INTEGER, allowNull: false },
    target_sets: { type: DataTypes.INTEGER, allowNull: true },
    target_reps: { type: DataTypes.STRING(50), allowNull: true },
    target_rest_seconds: { type: DataTypes.INTEGER, allowNull: true },
    completed_sets: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "pending" },
  },
  {
    tableName: "workout_session_exercises",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default WorkoutSessionExercise;

