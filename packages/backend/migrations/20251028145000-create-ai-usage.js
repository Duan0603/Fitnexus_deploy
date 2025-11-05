/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('ai_usage', {
    usage_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'users', key: 'user_id' }, onDelete: 'SET NULL' },
    anon_key: { type: Sequelize.STRING(128), allowNull: true },
    feature: { type: Sequelize.STRING(64), allowNull: false },
    period_key: { type: Sequelize.STRING(16), allowNull: false },
    count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  // Unique composite to support upsert-like logic
  await queryInterface.addConstraint('ai_usage', {
    type: 'unique',
    fields: ['user_id', 'anon_key', 'feature', 'period_key'],
    name: 'uq_ai_usage_key',
  });

  await queryInterface.addIndex('ai_usage', ['feature', 'period_key'], { name: 'idx_ai_usage_feature_period' });
  await queryInterface.addIndex('ai_usage', ['user_id'], { name: 'idx_ai_usage_user' });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('ai_usage');
}

