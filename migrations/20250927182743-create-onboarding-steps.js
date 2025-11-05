export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('onboarding_steps', {
    step_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    step_key: { type: Sequelize.STRING(50), allowNull: false, unique: true },
    title: { type: Sequelize.STRING(120), allowNull: false },
    order_index: { type: Sequelize.INTEGER, allowNull: false },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addIndex('onboarding_steps', ['order_index'], { name: 'onboarding_steps_order_idx' });
}
export async function down(queryInterface) {
  await queryInterface.dropTable('onboarding_steps');
}
