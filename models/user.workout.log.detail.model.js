import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
// Table: user_workout_log_details (no timestamps)
const UserWorkoutLogDetail = sequelize.define(
  "UserWorkoutLogDetail",
  {
    log_detail_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    log_id: { type: DataTypes.INTEGER, allowNull: false },
    exercise_id: { type: DataTypes.INTEGER, allowNull: false },
    set_number: { type: DataTypes.INTEGER, allowNull: false },
    reps_achieved: { type: DataTypes.INTEGER, allowNull: true },
    weight_kg: { type: DataTypes.DECIMAL(6, 2), allowNull: true },
    duration_seconds: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "user_workout_log_details",
    timestamps: false,
  }
);
export default UserWorkoutLogDetail;