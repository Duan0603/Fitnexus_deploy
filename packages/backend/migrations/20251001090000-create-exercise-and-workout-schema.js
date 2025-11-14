// Migration: create tables and indexes for ExercisesDemo, MuscleGroups,
// Exercise_MuscleGroup, ExerciseMuscleCombinations, ExerciseSteps,
// ExerciseTips, WorkoutPlans, Plan_Exercise_Details, UserWorkoutLogs,
// UserWorkoutLog_Details. No seed data.

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // 1) ExercisesDemo
    await queryInterface.createTable(
      'exercises',
      {
        exercise_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        name_en: { type: Sequelize.STRING(255), allowNull: true },
        slug: { type: Sequelize.STRING(255), allowNull: false, unique: true },
        description: { type: Sequelize.TEXT, allowNull: true },

        difficulty_level: { type: Sequelize.STRING(50), allowNull: true }, // beginner | intermediate | advanced
        exercise_type: { type: Sequelize.STRING(50), allowNull: true }, // compound | isolation | cardio | flexibility
        equipment_needed: { type: Sequelize.STRING(255), allowNull: true },

        primary_video_url: { type: Sequelize.STRING(255), allowNull: true },
        thumbnail_url: { type: Sequelize.STRING(255), allowNull: true },
        gif_demo_url: { type: Sequelize.STRING(255), allowNull: true },

        duration_minutes: { type: Sequelize.INTEGER, allowNull: true },
        calories_per_rep: { type: Sequelize.DECIMAL(4, 2), allowNull: true },
        popularity_score: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

        is_public: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        is_featured: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },

        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: true },
      },
      { transaction: t }
    );

    await queryInterface.addIndex('exercises', ['difficulty_level'], { name: 'exercises_difficulty_level_idx', transaction: t });
    await queryInterface.addIndex('exercises', ['exercise_type'], { name: 'exercises_exercise_type_idx', transaction: t });
    await queryInterface.addIndex('exercises', ['popularity_score'], { name: 'exercises_popularity_score_idx', transaction: t });

    // 2) MuscleGroups
    await queryInterface.createTable(
      'muscle_groups',
      {
        muscle_group_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(100), allowNull: false },
        name_en: { type: Sequelize.STRING(100), allowNull: false },
        slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
        description: { type: Sequelize.TEXT, allowNull: true },

        model_identifier: { type: Sequelize.STRING(100), allowNull: true, unique: true },
        mesh_ids: { type: Sequelize.JSONB, allowNull: true },
        highlight_color: { type: Sequelize.STRING(7), allowNull: true },
        model_position: { type: Sequelize.JSONB, allowNull: true },

        parent_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'muscle_groups', key: 'muscle_group_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        level: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        display_priority: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },

        is_selectable: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },

        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: true },
      },
      { transaction: t }
    );

    await queryInterface.addIndex('muscle_groups', ['parent_id'], { name: 'muscle_groups_parent_id_idx', transaction: t });
    await queryInterface.addIndex('muscle_groups', ['level'], { name: 'muscle_groups_level_idx', transaction: t });

    // 3) Exercise_MuscleGroup (bridge)
    await queryInterface.createTable(
      'exercise_muscle_group',
      {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        muscle_group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'muscle_groups', key: 'muscle_group_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        impact_level: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'primary' },
        intensity_percentage: { type: Sequelize.INTEGER, allowNull: true },
        activation_note: { type: Sequelize.TEXT, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('exercise_muscle_group', ['exercise_id'], { name: 'emg_exercise_id_idx', transaction: t });
    await queryInterface.addIndex('exercise_muscle_group', ['muscle_group_id'], { name: 'emg_muscle_group_id_idx', transaction: t });
    await queryInterface.addIndex('exercise_muscle_group', ['impact_level'], { name: 'emg_impact_level_idx', transaction: t });
    await queryInterface.addIndex('exercise_muscle_group', ['exercise_id', 'impact_level'], { name: 'emg_exercise_impact_idx', transaction: t });
    await queryInterface.addConstraint('exercise_muscle_group', {
      fields: ['exercise_id', 'muscle_group_id'],
      type: 'unique',
      name: 'emg_exercise_muscle_unique',
      transaction: t,
    });

    // 4) ExerciseMuscleCombinations
    await queryInterface.createTable(
      'exercise_muscle_combinations',
      {
        combination_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        muscle_group_ids_array: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: false },
        muscle_group_ids_sorted: { type: Sequelize.STRING(255), allowNull: false },
        muscle_group_slugs_sorted: { type: Sequelize.STRING(500), allowNull: true },

        primary_muscle_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        secondary_muscle_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        total_muscle_count: { type: Sequelize.INTEGER, allowNull: false },

        combination_type: { type: Sequelize.STRING(50), allowNull: true },
        complexity_score: { type: Sequelize.INTEGER, allowNull: true },

        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: true },
      },
      { transaction: t }
    );
    await queryInterface.addConstraint('exercise_muscle_combinations', {
      fields: ['exercise_id'],
      type: 'unique',
      name: 'emc_exercise_unique',
      transaction: t,
    });
    await queryInterface.addIndex('exercise_muscle_combinations', ['muscle_group_ids_sorted'], { name: 'emc_group_ids_sorted_idx', transaction: t });
    await queryInterface.addIndex('exercise_muscle_combinations', ['primary_muscle_count'], { name: 'emc_primary_count_idx', transaction: t });
    await queryInterface.addIndex('exercise_muscle_combinations', ['total_muscle_count'], { name: 'emc_total_count_idx', transaction: t });
    // GIN index for integer array
    await queryInterface.addIndex('exercise_muscle_combinations', ['muscle_group_ids_array'], {
      name: 'emc_group_ids_array_gin',
      using: 'GIN',
      transaction: t,
    });

    // 5) ExerciseSteps
    await queryInterface.createTable(
      'exercise_steps',
      {
        step_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        step_number: { type: Sequelize.INTEGER, allowNull: false },
        title: { type: Sequelize.STRING(150), allowNull: true },
        instruction_text: { type: Sequelize.TEXT, allowNull: false },
        media_url: { type: Sequelize.STRING(255), allowNull: true },
        media_type: { type: Sequelize.STRING(20), allowNull: true },
        focused_muscle_ids: { type: Sequelize.ARRAY(Sequelize.INTEGER), allowNull: true },
        duration_seconds: { type: Sequelize.INTEGER, allowNull: true },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('exercise_steps', ['exercise_id', 'step_number'], { name: 'exercise_steps_exercise_step_idx', transaction: t });

    // 6) ExerciseTips
    await queryInterface.createTable(
      'exercise_tips',
      {
        tip_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        tip_type: { type: Sequelize.STRING(30), allowNull: true },
        title: { type: Sequelize.STRING(150), allowNull: true },
        content: { type: Sequelize.TEXT, allowNull: false },
        display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('exercise_tips', ['exercise_id', 'tip_type'], { name: 'exercise_tips_exercise_type_idx', transaction: t });

    // 7) WorkoutPlans
    await queryInterface.createTable(
      'workout_plans',
      {
        plan_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: Sequelize.STRING(255), allowNull: false },
        description: { type: Sequelize.TEXT, allowNull: true },
        creator_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'user_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        difficulty_level: { type: Sequelize.STRING(50), allowNull: true },
        is_public: { type: Sequelize.BOOLEAN, allowNull: true },
      },
      { transaction: t }
    );

    // 8) Plan_Exercise_Details
    await queryInterface.createTable(
      'plan_exercise_details',
      {
        plan_exercise_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        plan_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'workout_plans', key: 'plan_id' },
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
        session_order: { type: Sequelize.INTEGER, allowNull: true },
        sets_recommended: { type: Sequelize.INTEGER, allowNull: true },
        reps_recommended: { type: Sequelize.STRING(50), allowNull: true },
        rest_period_seconds: { type: Sequelize.INTEGER, allowNull: true },
      },
      { transaction: t }
    );
    await queryInterface.addIndex('plan_exercise_details', ['plan_id'], { name: 'ped_plan_id_idx', transaction: t });
    await queryInterface.addIndex('plan_exercise_details', ['exercise_id'], { name: 'ped_exercise_id_idx', transaction: t });
    await queryInterface.addIndex('plan_exercise_details', ['plan_id', 'session_order'], { name: 'ped_plan_session_idx', transaction: t });

    // 9) UserWorkoutLogs
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
    await queryInterface.addIndex('user_workout_logs', [
      { attribute: 'user_id', order: 'ASC' },
      { attribute: 'started_at', order: 'DESC' },
    ], { name: 'uwl_user_started_idx', transaction: t });

    // 10) UserWorkoutLog_Details
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

    // Data integrity checks
    await queryInterface.sequelize.query(`
      ALTER TABLE exercise_muscle_group
        ADD CONSTRAINT emg_intensity_percentage_chk CHECK (intensity_percentage IS NULL OR (intensity_percentage >= 0 AND intensity_percentage <= 100));
      ALTER TABLE exercise_steps
        ADD CONSTRAINT exsteps_duration_nonneg_chk CHECK (duration_seconds IS NULL OR duration_seconds >= 0);
      ALTER TABLE user_workout_log_details
        ADD CONSTRAINT uwld_weight_nonneg_chk CHECK (weight_kg IS NULL OR weight_kg >= 0);
      ALTER TABLE user_workout_log_details
        ADD CONSTRAINT uwld_reps_nonneg_chk CHECK (reps_achieved IS NULL OR reps_achieved >= 0);
      ALTER TABLE exercises
        ADD CONSTRAINT exercises_duration_nonneg_chk CHECK (duration_minutes IS NULL OR duration_minutes >= 0);
      ALTER TABLE exercises
        ADD CONSTRAINT exercises_calories_nonneg_chk CHECK (calories_per_rep IS NULL OR calories_per_rep >= 0);
    `, { transaction: t });

    // Domain checks (use CHECK IN ... instead of ENUMs)
    await queryInterface.sequelize.query(`
      ALTER TABLE exercises
        ADD CONSTRAINT exercises_difficulty_level_chk CHECK (difficulty_level IS NULL OR difficulty_level IN ('beginner','intermediate','advanced')),
        ADD CONSTRAINT exercises_exercise_type_chk CHECK (exercise_type IS NULL OR exercise_type IN ('compound','isolation','cardio','flexibility'));

      ALTER TABLE exercise_muscle_group
        ADD CONSTRAINT emg_impact_level_chk CHECK (impact_level IN ('primary','secondary','stabilizer'));

      ALTER TABLE exercise_steps
        ADD CONSTRAINT exsteps_media_type_chk CHECK (media_type IS NULL OR media_type IN ('image','video','gif'));

      ALTER TABLE exercise_tips
        ADD CONSTRAINT extips_tip_type_chk CHECK (tip_type IS NULL OR tip_type IN ('common_mistake','pro_tip','safety','breathing'));
    `, { transaction: t });

    // Uniqueness constraints by semantics
    await queryInterface.addConstraint('exercise_steps', {
      fields: ['exercise_id', 'step_number'],
      type: 'unique',
      name: 'exercise_steps_unique_ex_step',
      transaction: t,
    });
    await queryInterface.addConstraint('plan_exercise_details', {
      fields: ['plan_id', 'session_order'],
      type: 'unique',
      name: 'ped_unique_plan_session',
      transaction: t,
    });

    // Function to refresh combinations
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION refresh_exercise_muscle_combination(ex_id integer)
      RETURNS void AS $$
      BEGIN
        WITH agg AS (
          SELECT
            COALESCE(array_agg(emg.muscle_group_id ORDER BY emg.muscle_group_id), ARRAY[]::int[]) AS ids,
            COALESCE(string_agg(emg.muscle_group_id::text, ',' ORDER BY emg.muscle_group_id), '') AS ids_sorted,
            COALESCE(string_agg(mg.slug, ',' ORDER BY emg.muscle_group_id), '') AS slugs_sorted,
            COUNT(*) FILTER (WHERE emg.impact_level = 'primary') AS primary_count,
            COUNT(*) FILTER (WHERE emg.impact_level = 'secondary') AS secondary_count,
            COUNT(*) AS total_count
          FROM exercise_muscle_group emg
          LEFT JOIN muscle_groups mg ON mg.muscle_group_id = emg.muscle_group_id
          WHERE emg.exercise_id = ex_id
        )
        INSERT INTO exercise_muscle_combinations (
          exercise_id,
          muscle_group_ids_array,
          muscle_group_ids_sorted,
          muscle_group_slugs_sorted,
          primary_muscle_count,
          secondary_muscle_count,
          total_muscle_count,
          created_at,
          updated_at
        )
        VALUES (
          ex_id,
          (SELECT ids FROM agg),
          (SELECT ids_sorted FROM agg),
          (SELECT slugs_sorted FROM agg),
          (SELECT primary_count FROM agg),
          (SELECT secondary_count FROM agg),
          (SELECT total_count FROM agg),
          NOW(),
          NOW()
        )
        ON CONFLICT (exercise_id) DO UPDATE SET
          muscle_group_ids_array = EXCLUDED.muscle_group_ids_array,
          muscle_group_ids_sorted = EXCLUDED.muscle_group_ids_sorted,
          muscle_group_slugs_sorted = EXCLUDED.muscle_group_slugs_sorted,
          primary_muscle_count = EXCLUDED.primary_muscle_count,
          secondary_muscle_count = EXCLUDED.secondary_muscle_count,
          total_muscle_count = EXCLUDED.total_muscle_count,
          updated_at = NOW();
      END;
      $$ LANGUAGE plpgsql;
    `, { transaction: t });

    // Trigger to sync combinations after EMG changes
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE FUNCTION emg_after_row_change()
      RETURNS trigger AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          PERFORM refresh_exercise_muscle_combination(NEW.exercise_id);
        ELSIF (TG_OP = 'UPDATE') THEN
          IF NEW.exercise_id IS DISTINCT FROM OLD.exercise_id THEN
            PERFORM refresh_exercise_muscle_combination(OLD.exercise_id);
            PERFORM refresh_exercise_muscle_combination(NEW.exercise_id);
          ELSE
            PERFORM refresh_exercise_muscle_combination(NEW.exercise_id);
          END IF;
        ELSIF (TG_OP = 'DELETE') THEN
          PERFORM refresh_exercise_muscle_combination(OLD.exercise_id);
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS tr_emg_after_change ON exercise_muscle_group;
      CREATE TRIGGER tr_emg_after_change
      AFTER INSERT OR UPDATE OR DELETE ON exercise_muscle_group
      FOR EACH ROW EXECUTE FUNCTION emg_after_row_change();
    `, { transaction: t });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export async function down(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // Drop trigger/functions first
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS tr_emg_after_change ON exercise_muscle_group;
      DROP FUNCTION IF EXISTS emg_after_row_change();
      DROP FUNCTION IF EXISTS refresh_exercise_muscle_combination(integer);
    `, { transaction: t }).catch(() => {});

    // Drop in reverse dependency order
    await queryInterface.dropTable('user_workout_log_details', { transaction: t });
    await queryInterface.dropTable('user_workout_logs', { transaction: t });
    await queryInterface.dropTable('plan_exercise_details', { transaction: t });
    await queryInterface.dropTable('workout_plans', { transaction: t });
    await queryInterface.dropTable('exercise_tips', { transaction: t });
    await queryInterface.dropTable('exercise_steps', { transaction: t });
    await queryInterface.dropTable('exercise_muscle_combinations', { transaction: t });
    await queryInterface.dropTable('exercise_muscle_group', { transaction: t });
    await queryInterface.dropTable('muscle_groups', { transaction: t });
    await queryInterface.dropTable('exercises', { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
