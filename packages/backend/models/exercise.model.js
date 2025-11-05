import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

// Match canonical schema created in 20251001090000-create-exercise-and-workout-schema.js
const Exercise = sequelize.define(
  "Exercise",
  {
    exercise_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name_en: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    difficulty_level: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    exercise_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    equipment_needed: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    primary_video_url: { type: DataTypes.STRING(255), allowNull: true },
    thumbnail_url: { type: DataTypes.STRING(255), allowNull: true },
    gif_demo_url: { type: DataTypes.STRING(255), allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, allowNull: true },
    calories_per_rep: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
    popularity_score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_public: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    is_featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "exercises",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Exercise;
