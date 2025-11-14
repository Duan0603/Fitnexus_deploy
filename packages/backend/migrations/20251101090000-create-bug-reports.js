/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('bug_reports', {
    report_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    contact_email: { type: Sequelize.STRING(255), allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    steps: { type: Sequelize.TEXT, allowNull: true },
    severity: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'medium' },
    status: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'open' },
    screenshot_url: { type: Sequelize.TEXT, allowNull: true },
    admin_response: { type: Sequelize.TEXT, allowNull: true },
    responded_by: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    responded_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  await queryInterface.addIndex('bug_reports', ['status'], { name: 'idx_bug_reports_status' });
  await queryInterface.addIndex('bug_reports', ['severity'], { name: 'idx_bug_reports_severity' });
  await queryInterface.addIndex('bug_reports', ['user_id'], { name: 'idx_bug_reports_user' });
  await queryInterface.addIndex('bug_reports', ['created_at'], { name: 'idx_bug_reports_created' });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('bug_reports');
}
