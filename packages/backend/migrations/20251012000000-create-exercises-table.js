// ESM-compatible migration wrapper
// Note: This migration is effectively a no-op in current schema because a more
// comprehensive exercises table is created by 20251001090000-create-exercise-and-workout-schema.js.
// We keep this file to preserve history; it will only create a simple exercises table
// if it does not already exist (e.g., in isolated test envs).

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // check existence; describeTable throws if not exists
    let exists = true;
    try {
      await queryInterface.describeTable('exercises');
    } catch {
      exists = false;
    }
    if (exists) {
      await t.commit();
      return;
    }
    await queryInterface.createTable(
      'exercises',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING, allowNull: false },
        description: { type: Sequelize.TEXT },
        muscleGroup: { type: Sequelize.STRING, allowNull: false },
        difficulty: { type: Sequelize.STRING },
        equipment: { type: Sequelize.STRING },
        instructions: { type: Sequelize.TEXT },
        imageUrl: { type: Sequelize.STRING },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      },
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
    // Drop only if this migration created the simple table
    // If the comprehensive schema exists, keep it.
    let columns;
    try {
      columns = await queryInterface.describeTable('exercises');
    } catch {
      await t.commit();
      return;
    }
    // heuristic: simple table has column 'muscleGroup'; comprehensive one does not
    if (columns && Object.prototype.hasOwnProperty.call(columns, 'muscleGroup')) {
      await queryInterface.dropTable('exercises', { transaction: t });
    }
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
