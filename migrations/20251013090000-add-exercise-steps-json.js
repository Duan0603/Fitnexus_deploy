// Migration: add exercise_steps_json table to store steps as JSONB per exercise

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.createTable(
      'exercise_steps_json',
      {
        exercise_id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        steps: { type: Sequelize.JSONB, allowNull: false },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      },
      { transaction: t }
    );

    // GIN index on steps for containment queries / search
    await queryInterface.sequelize.query(
      `CREATE INDEX IF NOT EXISTS exercise_steps_json_gin ON exercise_steps_json USING GIN (steps)`,
      { transaction: t }
    );

    // Backfill from existing exercise_steps (if any)
    await queryInterface.sequelize.query(
      `INSERT INTO exercise_steps_json (exercise_id, steps, updated_at)
       SELECT es.exercise_id,
              jsonb_agg(jsonb_build_object(
                'step_number', es.step_number,
                'instruction_text', es.instruction_text,
                'title', es.title,
                'media_url', es.media_url,
                'media_type', es.media_type
              ) ORDER BY es.step_number) AS steps,
              NOW()
       FROM exercise_steps es
       GROUP BY es.exercise_id
       ON CONFLICT (exercise_id) DO UPDATE
       SET steps = EXCLUDED.steps,
           updated_at = NOW()`,
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
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS exercise_steps_json_gin`,
      { transaction: t }
    );
    await queryInterface.dropTable('exercise_steps_json', { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

