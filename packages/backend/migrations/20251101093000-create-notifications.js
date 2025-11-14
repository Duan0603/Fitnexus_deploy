/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('notifications', {
    notification_id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    type: { type: Sequelize.STRING(64), allowNull: false, defaultValue: 'general' },
    title: { type: Sequelize.STRING(255), allowNull: false },
    body: { type: Sequelize.TEXT, allowNull: true },
    metadata: { type: Sequelize.JSONB, allowNull: true },
    read_at: { type: Sequelize.DATE, allowNull: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
  });

  await queryInterface.addIndex('notifications', ['user_id', 'read_at'], {
    name: 'idx_notifications_user_read',
  });
  await queryInterface.addIndex('notifications', ['user_id', 'created_at'], {
    name: 'idx_notifications_user_created',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('notifications');
}
