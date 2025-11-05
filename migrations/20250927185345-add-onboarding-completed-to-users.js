export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('users', 'onboarding_completed_at', {
    type: Sequelize.DATE,
    allowNull: true,
  });
}
export async function down(queryInterface) {
  await queryInterface.removeColumn('users', 'onboarding_completed_at');
}