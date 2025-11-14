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
  // Create a unique index (if not exists) instead of addConstraint so the
  // migration is idempotent and doesn't error when the index already exists.
  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS exercise_favorites_user_exercise_unique ON exercise_favorites (user_id, exercise_id)`
  );
}

export async function down(queryInterface, Sequelize) {
  // Drop the unique index/constraint if it exists
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS exercise_favorites_user_exercise_unique`
  );
}
