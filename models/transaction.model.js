// packages/backend/models/transaction.model.js
import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Transaction = sequelize.define(
  'Transaction',
  {
    transaction_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
    payos_order_code: { type: DataTypes.STRING(64), allowNull: false, unique: true, comment: 'Mã orderCode gửi payOS' },
    payos_payment_id: { type: DataTypes.STRING(64), allowNull: true, comment: 'Payment ID từ payOS' },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

export default Transaction;

