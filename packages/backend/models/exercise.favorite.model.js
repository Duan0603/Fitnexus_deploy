import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ExerciseFavorite = sequelize.define(
  'ExerciseFavorite',
  {
    favorite_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    exercise_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  {
    tableName: 'exercise_favorites',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

export default ExerciseFavorite;
