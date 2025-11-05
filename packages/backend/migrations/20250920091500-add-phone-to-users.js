export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'phone', {
    type: Sequelize.STRING(20),
    allowNull: true,
  });
  // Optional: create explicit unique index name for clarity
  await queryInterface.addIndex('users', ['phone'], {
    unique: true,
    name: 'users_phone_unique_idx',
    where: {
      phone: { [Sequelize.Op.ne]: null },
    },
  });
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.removeIndex('users', 'users_phone_unique_idx').catch(() => {});
  await queryInterface.removeColumn('users', 'phone');
}