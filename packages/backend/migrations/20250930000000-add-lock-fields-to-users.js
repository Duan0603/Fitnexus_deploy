/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "is_locked", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("users", "locked_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "lock_reason", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "lock_reason");
    await queryInterface.removeColumn("users", "locked_at");
    await queryInterface.removeColumn("users", "is_locked");
  },
};
