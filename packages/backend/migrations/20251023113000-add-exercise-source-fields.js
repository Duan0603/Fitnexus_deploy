// Migration: add source info and verification to exercises

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn(
      'exercises',
      'source_name',
      { type: Sequelize.STRING(150), allowNull: true },
      { transaction: t }
    );
    await queryInterface.addColumn(
      'exercises',
      'source_url',
      { type: Sequelize.STRING(500), allowNull: true },
      { transaction: t }
    );
    await queryInterface.addColumn(
      'exercises',
      'is_verified',
      { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      { transaction: t }
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export async function down(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeColumn('exercises', 'is_verified', { transaction: t });
    await queryInterface.removeColumn('exercises', 'source_url', { transaction: t });
    await queryInterface.removeColumn('exercises', 'source_name', { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

