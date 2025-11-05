import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OnboardingSession = sequelize.define('OnboardingSession', {
  session_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  current_step_key: { type: DataTypes.STRING(50), allowNull: true },
  is_completed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'onboarding_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['is_completed'] },
  ],
});

export default OnboardingSession;
