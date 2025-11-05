export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('subscription_plans', {
    plan_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: Sequelize.STRING(120), allowNull: false },
    slug: { type: Sequelize.STRING(120), allowNull: false, unique: true },
    price: { type: Sequelize.INTEGER, allowNull: false }, // in VND
    duration_days: { type: Sequelize.INTEGER, allowNull: false },
    is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });
  await queryInterface.addIndex('subscription_plans', ['slug'], { unique: true, name: 'uq_subscription_plans_slug' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('subscription_plans');
}

