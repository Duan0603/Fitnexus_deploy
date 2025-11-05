// Migration: seed initial parent muscle groups taxonomy (level 0)
// Parents: Chest, Back, Shoulders, Arms, Core, Legs
// This is schema-level taxonomy bootstrap (no child data here).

export async function up(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.sequelize.query(
      `INSERT INTO muscle_groups (
         name, name_en, slug, description, parent_id, level, display_priority, is_selectable, created_at, updated_at
       ) VALUES
         ('Ngực','Chest','chest','Nhóm cơ ngực (pectorals).',NULL,0,10,TRUE,NOW(),NOW()),
         ('Lưng','Back','back','Nhóm cơ lưng (kéo, tư thế).',NULL,0,20,TRUE,NOW(),NOW()),
         ('Vai','Shoulders','shoulders','Nhóm cơ vai (deltoids).',NULL,0,30,TRUE,NOW(),NOW()),
         ('Tay','Arms','arms','Nhóm cơ tay (biceps, triceps, forearms).',NULL,0,40,TRUE,NOW(),NOW()),
         ('Core','Core','core','Cơ trung tâm (abs, obliques, TVA).',NULL,0,50,TRUE,NOW(),NOW()),
         ('Chân','Legs','legs','Cơ chân (quads, hamstrings, glutes, calves).',NULL,0,60,TRUE,NOW(),NOW())
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         name_en = EXCLUDED.name_en,
         description = EXCLUDED.description,
         level = EXCLUDED.level,
         display_priority = EXCLUDED.display_priority,
         is_selectable = EXCLUDED.is_selectable,
         updated_at = NOW();`,
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
      `DELETE FROM muscle_groups WHERE slug IN ('chest','back','shoulders','arms','core','legs');`,
      { transaction: t }
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
