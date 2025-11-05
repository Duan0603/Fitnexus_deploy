// Migration: Alter workout tracking tables (add timestamps + safety checks)
// Note: Do not edit prior migrations; apply incremental changes here.

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // Add timestamps to workout_session_exercises
    await queryInterface.addColumn(
      'workout_session_exercises',
      'created_at',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction: t }
    );
    await queryInterface.addColumn(
      'workout_session_exercises',
      'updated_at',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction: t }
    );

    // Add timestamps to workout_session_sets
    await queryInterface.addColumn(
      'workout_session_sets',
      'created_at',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction: t }
    );
    await queryInterface.addColumn(
      'workout_session_sets',
      'updated_at',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      { transaction: t }
    );

    // Add non-negative checks (status is handled by ENUM from the initial migration)
    await queryInterface.sequelize.query(
      `ALTER TABLE workout_sessions
         ADD CONSTRAINT ws_total_duration_nonneg CHECK (total_duration_seconds IS NULL OR total_duration_seconds >= 0);
       ALTER TABLE workout_sessions
         ADD CONSTRAINT ws_current_index_nonneg CHECK (current_exercise_index IS NULL OR current_exercise_index >= 0);

       ALTER TABLE workout_session_exercises
         ADD CONSTRAINT wse_target_sets_nonneg CHECK (target_sets IS NULL OR target_sets >= 0);
       ALTER TABLE workout_session_exercises
         ADD CONSTRAINT wse_target_rest_nonneg CHECK (target_rest_seconds IS NULL OR target_rest_seconds >= 0);
       ALTER TABLE workout_session_exercises
         ADD CONSTRAINT wse_completed_sets_nonneg CHECK (completed_sets >= 0);

       ALTER TABLE workout_session_sets
         ADD CONSTRAINT wss_set_index_pos CHECK (set_index > 0);
       ALTER TABLE workout_session_sets
         ADD CONSTRAINT wss_actual_reps_nonneg CHECK (actual_reps IS NULL OR actual_reps >= 0);
       ALTER TABLE workout_session_sets
         ADD CONSTRAINT wss_actual_weight_nonneg CHECK (actual_weight_kg IS NULL OR actual_weight_kg >= 0);
       ALTER TABLE workout_session_sets
         ADD CONSTRAINT wss_rest_nonneg CHECK (rest_seconds IS NULL OR rest_seconds >= 0);`,
      { transaction: t }
    );

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

export async function down(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // Drop constraints first
    await queryInterface.sequelize.query(
      `ALTER TABLE workout_session_sets
         DROP CONSTRAINT IF EXISTS wss_rest_nonneg,
         DROP CONSTRAINT IF EXISTS wss_actual_weight_nonneg,
         DROP CONSTRAINT IF EXISTS wss_actual_reps_nonneg,
         DROP CONSTRAINT IF EXISTS wss_set_index_pos;

       ALTER TABLE workout_session_exercises
         DROP CONSTRAINT IF EXISTS wse_completed_sets_nonneg,
         DROP CONSTRAINT IF EXISTS wse_target_rest_nonneg,
         DROP CONSTRAINT IF EXISTS wse_target_sets_nonneg;

       ALTER TABLE workout_sessions
         DROP CONSTRAINT IF EXISTS ws_current_index_nonneg,
         DROP CONSTRAINT IF EXISTS ws_total_duration_nonneg;`,
      { transaction: t }
    );

    // Drop added columns
    await queryInterface.removeColumn('workout_session_sets', 'updated_at', { transaction: t });
    await queryInterface.removeColumn('workout_session_sets', 'created_at', { transaction: t });
    await queryInterface.removeColumn('workout_session_exercises', 'updated_at', { transaction: t });
    await queryInterface.removeColumn('workout_session_exercises', 'created_at', { transaction: t });

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

