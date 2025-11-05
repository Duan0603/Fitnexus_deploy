export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("login_history", {
    login_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false },
    ip_address: { type: Sequelize.STRING(64), allowNull: true },
    user_agent: { type: Sequelize.TEXT, allowNull: true },
    os: { type: Sequelize.STRING(64), allowNull: true },
    browser: { type: Sequelize.STRING(64), allowNull: true },
    device: { type: Sequelize.STRING(64), allowNull: true },
    city: { type: Sequelize.STRING(128), allowNull: true },
    country: { type: Sequelize.STRING(64), allowNull: true },
    success: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
  });

  await queryInterface.addIndex("login_history", ["user_id", "created_at"], {
    name: "idx_login_history_user_created",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("login_history");
}
