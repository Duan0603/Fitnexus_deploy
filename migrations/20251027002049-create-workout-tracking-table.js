// Migration file: YYYYMMDDHHMMSS-create-workout-tracking-tables.js
// Thiết kế tối ưu - Tập trung vào chức năng cốt lõi

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    // 1) workout_sessions - Phiên tập luyện
    await queryInterface.createTable(
      'workout_sessions',
      {
        session_id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true, 
          autoIncrement: true 
        },
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
        status: { 
          type: Sequelize.ENUM('in_progress', 'paused', 'completed', 'cancelled'),
          allowNull: false,
          defaultValue: 'in_progress'
        },
        started_at: { 
          type: Sequelize.DATE, 
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        ended_at: { 
          type: Sequelize.DATE, 
          allowNull: true
        },
        total_duration_seconds: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Total workout duration in seconds'
        },
        current_exercise_index: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          defaultValue: 0,
          comment: 'Index of current exercise being performed (0-based)'
        },
        notes: { 
          type: Sequelize.TEXT, 
          allowNull: true 
        },
        created_at: { 
          type: Sequelize.DATE, 
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: { 
          type: Sequelize.DATE, 
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
      },
      { transaction: t }
    );

    // 2) workout_session_exercises - Bài tập trong phiên
    await queryInterface.createTable(
      'workout_session_exercises',
      {
        session_exercise_id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true, 
          autoIncrement: true 
        },
        session_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'workout_sessions', key: 'session_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        plan_exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'plan_exercise_details', key: 'plan_exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Link back to original plan exercise for history tracking'
        },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        session_order: { 
          type: Sequelize.INTEGER, 
          allowNull: false,
          comment: 'Order of exercise in this session (1, 2, 3, ...)'
        },
        target_sets: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Planned number of sets'
        },
        target_reps: { 
          type: Sequelize.STRING(50), 
          allowNull: true,
          comment: 'Planned reps (e.g., "10-12", "8", "AMRAP")'
        },
        target_rest_seconds: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Planned rest time between sets'
        },
        completed_sets: { 
          type: Sequelize.INTEGER, 
          allowNull: false,
          defaultValue: 0,
          comment: 'Number of sets actually completed'
        },
        status: { 
          type: Sequelize.ENUM('pending', 'in_progress', 'completed', 'skipped'),
          allowNull: false,
          defaultValue: 'pending'
        },
      },
      { transaction: t }
    );

    // 3) workout_session_sets - Chi tiết từng set
    await queryInterface.createTable(
      'workout_session_sets',
      {
        set_id: { 
          type: Sequelize.INTEGER, 
          primaryKey: true, 
          autoIncrement: true 
        },
        session_exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'workout_session_exercises', key: 'session_exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        set_index: { 
          type: Sequelize.INTEGER, 
          allowNull: false,
          comment: 'Set number (1, 2, 3, ...)'
        },
        actual_reps: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Actual reps completed'
        },
        actual_weight_kg: { 
          type: Sequelize.DECIMAL(10, 2), 
          allowNull: true,
          comment: 'Actual weight used in kg'
        },
        rest_seconds: { 
          type: Sequelize.INTEGER, 
          allowNull: true,
          comment: 'Actual rest time taken after this set'
        },
        completed_at: { 
          type: Sequelize.DATE, 
          allowNull: true,
          comment: 'Timestamp when set was completed'
        },
        notes: { 
          type: Sequelize.TEXT, 
          allowNull: true,
          comment: 'Optional notes for this set'
        },
      },
      { transaction: t }
    );

    // Indexes
    await queryInterface.addIndex('workout_sessions', ['user_id', 'started_at'], { 
      name: 'ws_user_started_idx', 
      transaction: t 
    });
    await queryInterface.addIndex('workout_sessions', ['plan_id'], { 
      name: 'ws_plan_id_idx', 
      transaction: t 
    });
    await queryInterface.addIndex('workout_sessions', ['status'], { 
      name: 'ws_status_idx', 
      transaction: t 
    });

    await queryInterface.addIndex('workout_session_exercises', ['session_id'], { 
      name: 'wse_session_id_idx', 
      transaction: t 
    });
    await queryInterface.addIndex('workout_session_exercises', ['exercise_id'], { 
      name: 'wse_exercise_id_idx', 
      transaction: t 
    });
    
    // Unique constraint: one exercise per order in session
    await queryInterface.addConstraint('workout_session_exercises', {
      fields: ['session_id', 'session_order'],
      type: 'unique',
      name: 'wse_unique_session_order',
      transaction: t
    });

    await queryInterface.addIndex('workout_session_sets', ['session_exercise_id'], { 
      name: 'wss_session_exercise_id_idx', 
      transaction: t 
    });
    
    // Unique constraint: one set per index in exercise
    await queryInterface.addConstraint('workout_session_sets', {
      fields: ['session_exercise_id', 'set_index'],
      type: 'unique',
      name: 'wss_unique_exercise_set',
      transaction: t
    });

    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.dropTable('workout_session_sets', { transaction: t });
    await queryInterface.dropTable('workout_session_exercises', { transaction: t });
    await queryInterface.dropTable('workout_sessions', { transaction: t });
    await t.commit();
  } catch (error) {
    await t.rollback();
    throw error;
  }
}