// Migration: create image_exercise table to store exercise images

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.createTable(
      'image_exercise',
      {
        image_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
        exercise_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'exercises', key: 'exercise_id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        image_url: { type: Sequelize.STRING(255), allowNull: false },
        image_type: { type: Sequelize.STRING(30), allowNull: true }, // cover | gallery | gif | thumbnail
        alt_text: { type: Sequelize.STRING(255), allowNull: true },
        width: { type: Sequelize.INTEGER, allowNull: true },
        height: { type: Sequelize.INTEGER, allowNull: true },
        display_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        is_primary: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: true },
      },
      { transaction: t }
    );

    // Helpful indexes
    await queryInterface.addIndex('image_exercise', ['exercise_id'], { name: 'img_exercise_exercise_id_idx', transaction: t });
    await queryInterface.addIndex('image_exercise', ['exercise_id', 'display_order'], { name: 'img_exercise_exercise_order_idx', transaction: t });

    // Constraints and checks
    await queryInterface.sequelize.query(`
      ALTER TABLE image_exercise
        ADD CONSTRAINT img_ex_display_nonneg_chk CHECK (display_order >= 0),
        ADD CONSTRAINT img_ex_wh_nonneg_chk CHECK (
          (width IS NULL OR width >= 0) AND (height IS NULL OR height >= 0)
        ),
        ADD CONSTRAINT img_ex_type_chk CHECK (
          image_type IS NULL OR image_type IN ('cover','gallery','gif','thumbnail')
        );

      -- At most one primary image per exercise (partial unique index)
      CREATE UNIQUE INDEX IF NOT EXISTS img_ex_one_primary
        ON image_exercise(exercise_id)
        WHERE is_primary IS TRUE;
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
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS img_ex_one_primary;
    `, { transaction: t });
    await queryInterface.dropTable('image_exercise', { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

