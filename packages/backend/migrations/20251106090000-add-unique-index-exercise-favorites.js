/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  // Add a unique constraint to ensure one favorite per (user_id, exercise_id)
  // First, remove any existing duplicates to avoid constraint failure
  await queryInterface.sequelize.query(`
    WITH ranked AS (
      SELECT favorite_id,
             ROW_NUMBER() OVER (PARTITION BY user_id, exercise_id ORDER BY favorite_id ASC) AS rn
      FROM exercise_favorites
    )
    DELETE FROM exercise_favorites ef
    USING ranked r
    WHERE ef.favorite_id = r.favorite_id AND r.rn > 1;
  `);
  await queryInterface.addConstraint('exercise_favorites', {
    fields: ['user_id', 'exercise_id'],
    type: 'unique',
    name: 'exercise_favorites_user_exercise_unique',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint('exercise_favorites', 'exercise_favorites_user_exercise_unique');
}
