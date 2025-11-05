// packages/backend/migrations/20251000318429-add-subadmin-fields.js
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("users", "is_super_admin", {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn("users", "parent_admin_id", {
    type: Sequelize.INTEGER,
    allowNull: true,
    references: { model: "users", key: "user_id" },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await queryInterface.addIndex("users", ["is_super_admin"]);
  await queryInterface.addIndex("users", ["parent_admin_id"]);
}

export async function down(queryInterface /*, Sequelize */) {
  await queryInterface.removeIndex("users", ["is_super_admin"]);
  await queryInterface.removeIndex("users", ["parent_admin_id"]);
  await queryInterface.removeColumn("users", "parent_admin_id");
  await queryInterface.removeColumn("users", "is_super_admin");
}
