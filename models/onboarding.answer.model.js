import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OnboardingAnswer = sequelize.define('OnboardingAnswer', {
  answer_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  session_id: { type: DataTypes.UUID, allowNull: false },
  step_id: { type: DataTypes.INTEGER, allowNull: false },
  answers: { type: DataTypes.JSONB, allowNull: false },
}, {
  tableName: 'onboarding_answers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['session_id'] },
    { fields: ['step_id'] },
    { unique: true, fields: ['session_id', 'step_id'] },
  ],
});

export default OnboardingAnswer;
