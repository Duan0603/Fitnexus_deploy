/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "last_active_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    // Index phụ: lọc nhanh theo hoạt động gần đây (tùy chọn)
    await queryInterface.addIndex("users", ["last_active_at"], {
      name: "users_last_active_at_idx",
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("users", "users_last_active_at_idx").catch(() => {});
    await queryInterface.removeColumn("users", "last_active_at");
  },
};
