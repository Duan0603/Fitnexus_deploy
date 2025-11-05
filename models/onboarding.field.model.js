import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const OnboardingField = sequelize.define('OnboardingField', {
  field_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  step_id: { type: DataTypes.INTEGER, allowNull: false },
  field_key: { type: DataTypes.STRING(50), allowNull: false },
  label: { type: DataTypes.STRING(120), allowNull: false },
  input_type: { type: DataTypes.STRING(30), allowNull: false },
  required: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  order_index: { type: DataTypes.INTEGER, allowNull: true },
  metadata: { type: DataTypes.JSONB, allowNull: true },
}, {
  tableName: 'onboarding_fields',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['step_id'] },
    { unique: true, fields: ['step_id', 'field_key'] },
  ],
});

export default OnboardingField;
