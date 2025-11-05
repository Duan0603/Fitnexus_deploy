import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OnboardingStep = sequelize.define('OnboardingStep', {
  step_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  step_key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  title: { type: DataTypes.STRING(120), allowNull: false },
  order_index: { type: DataTypes.INTEGER, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'onboarding_steps',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

export default OnboardingStep;
