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
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'exercise_id'],
        name: 'exercise_favorites_user_exercise_unique',
      },
    ],
  }
);

export default ExerciseFavorite;
