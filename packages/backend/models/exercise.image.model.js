import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const ExerciseImage = sequelize.define(
  "ExerciseImage",
  {
    image_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    exercise_id: { type: DataTypes.INTEGER, allowNull: false },
    image_url: { type: DataTypes.STRING(255), allowNull: false },
    image_type: { type: DataTypes.STRING(30), allowNull: true },
    alt_text: { type: DataTypes.STRING(255), allowNull: true },
    width: { type: DataTypes.INTEGER, allowNull: true },
    height: { type: DataTypes.INTEGER, allowNull: true },
    display_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "image_exercise",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default ExerciseImage;

