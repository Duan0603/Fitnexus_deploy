import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const WorkoutPlan = sequelize.define(
  "WorkoutPlan",
  {
    plan_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    creator_id: { type: DataTypes.INTEGER, allowNull: true },
    difficulty_level: { type: DataTypes.STRING(50), allowNull: true },
    is_public: { type: DataTypes.BOOLEAN, allowNull: true },
  },
  {
    tableName: "workout_plans",
    timestamps: false,
  }
);
export default WorkoutPlan;
