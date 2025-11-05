import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
const PlanExerciseDetail = sequelize.define(
  "PlanExerciseDetail",
  {
    plan_exercise_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_id: { type: DataTypes.INTEGER, allowNull: false },
    exercise_id: { type: DataTypes.INTEGER, allowNull: false },
    session_order: { type: DataTypes.INTEGER, allowNull: true },
    sets_recommended: { type: DataTypes.INTEGER, allowNull: true },
    reps_recommended: { type: DataTypes.STRING(50), allowNull: true },
    rest_period_seconds: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "plan_exercise_details",
    timestamps: false,
  }
);
export default PlanExerciseDetail;