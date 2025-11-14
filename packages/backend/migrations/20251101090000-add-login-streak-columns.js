export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("users", "login_streak", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
  await queryInterface.addColumn("users", "max_login_streak", {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });
  await queryInterface.addColumn("users", "login_streak_updated_at", {
    type: Sequelize.DATE,
    allowNull: true,
  });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn("users", "login_streak");
  await queryInterface.removeColumn("users", "max_login_streak");
  await queryInterface.removeColumn("users", "login_streak_updated_at");
}
