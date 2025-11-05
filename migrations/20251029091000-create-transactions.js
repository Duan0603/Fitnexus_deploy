export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('transactions', {
    transaction_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'user_id' }, onDelete: 'CASCADE' },
    plan_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'subscription_plans', key: 'plan_id' }, onDelete: 'RESTRICT' },
    amount: { type: Sequelize.INTEGER, allowNull: false },
    status: { type: Sequelize.ENUM('pending', 'completed', 'failed'), allowNull: false, defaultValue: 'pending' },
    payos_order_code: { type: Sequelize.STRING(64), allowNull: false, unique: true },
    payos_payment_id: { type: Sequelize.STRING(64), allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addIndex('transactions', ['user_id'], { name: 'idx_transactions_user' });
  await queryInterface.addIndex('transactions', ['plan_id'], { name: 'idx_transactions_plan' });
  await queryInterface.addIndex('transactions', ['status'], { name: 'idx_transactions_status' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('transactions');
}

