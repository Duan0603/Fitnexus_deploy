// packages/backend/models/subscription.plan.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const SubscriptionPlan = sequelize.define(
  'SubscriptionPlan',
  {
    plan_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    price: { type: DataTypes.INTEGER, allowNull: false },
    duration_days: { type: DataTypes.INTEGER, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    tableName: 'subscription_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default SubscriptionPlan;

