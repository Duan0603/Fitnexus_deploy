// Migration: drop legacy user workout log tables in favor of session-based tracking

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // Drop detail table first due to FK dependency
    await queryInterface.sequelize.query(
      'DROP TABLE IF EXISTS "user_workout_log_details" CASCADE;',
      { transaction: t }
    );
    await queryInterface.sequelize.query(
      'DROP TABLE IF EXISTS "user_workout_logs" CASCADE;',
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
    // Recreate user_workout_logs
    await queryInterface.createTable(
      'user_workout_logs',
      {
        log_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        plan_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'workout_plans', key: 'plan_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        started_at: { type: Sequelize.DATE, allowNull: false },
        completed_at: { type: Sequelize.DATE, allowNull: true },
        notes: { type: Sequelize.TEXT, allowNull: true },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('user_workout_logs', ['user_id'], { name: 'uwl_user_id_idx', transaction: t });
    await queryInterface.addIndex('user_workout_logs', ['plan_id'], { name: 'uwl_plan_id_idx', transaction: t });
    await queryInterface.addIndex(
      'user_workout_logs',
      [
        { attribute: 'user_id', order: 'ASC' },
        { attribute: 'started_at', order: 'DESC' },
      ],
      { name: 'uwl_user_started_idx', transaction: t }
    );

    // Recreate user_workout_log_details
    await queryInterface.createTable(
      'user_workout_log_details',
      {
        log_detail_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        log_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'user_workout_logs', key: 'log_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        set_number: { type: Sequelize.INTEGER, allowNull: false },
        reps_achieved: { type: Sequelize.INTEGER, allowNull: true },
        weight_kg: { type: Sequelize.DECIMAL(6, 2), allowNull: true },
        duration_seconds: { type: Sequelize.INTEGER, allowNull: true },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('user_workout_log_details', ['log_id'], { name: 'uwld_log_id_idx', transaction: t });
    await queryInterface.addIndex('user_workout_log_details', ['exercise_id'], { name: 'uwld_exercise_id_idx', transaction: t });

    // Restore check constraints for non-negative values
    await queryInterface.sequelize.query(
      `ALTER TABLE user_workout_log_details
         ADD CONSTRAINT uwld_weight_nonneg_chk CHECK (weight_kg IS NULL OR weight_kg >= 0);
       ALTER TABLE user_workout_log_details
         ADD CONSTRAINT uwld_reps_nonneg_chk CHECK (reps_achieved IS NULL OR reps_achieved >= 0);`,
      { transaction: t }
    );

    await t.commit();
  } catch (e) {
    await t.rollback();
    throw e;
  }
}

