// Migration: seed child muscle groups (level 1) under parents
// Parents assumed present: chest, back, shoulders, arms, core, legs
// Aliases are intentionally NOT stored here.

export async function up(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.sequelize.query(`
      INSERT INTO muscle_groups (name, name_en, slug, description, parent_id, level, display_priority, is_selectable, created_at, updated_at)
      VALUES
      -- Chest
      ('Ngực trên','Upper Chest','upper-chest','Phần sợi trên của cơ ngực lớn; hoạt động mạnh trong các bài đẩy dốc lên (incline).',(SELECT muscle_group_id FROM muscle_groups WHERE slug='chest'),1,10,TRUE,NOW(),NOW()),
      ('Ngực giữa','Mid Chest','mid-chest','Phần trung tâm của cơ ngực; tham gia trong bench press ngang và các biến thể đẩy tạ ngang.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='chest'),1,20,TRUE,NOW(),NOW()),
      ('Ngực dưới','Lower Chest','lower-chest','Phần sợi dưới của cơ ngực; hoạt động rõ trong động tác đẩy dốc xuống (decline) và dip.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='chest'),1,30,TRUE,NOW(),NOW()),

      -- Back
      ('Cơ lưng rộng','Latissimus Dorsi','latissimus-dorsi','Cơ lưng rộng (lats) kéo tay về thân; chủ đạo trong kéo xà, row, pulldown.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='back'),1,10,TRUE,NOW(),NOW()),
      ('Cơ thang','Trapezius','trapezius','Cơ thang ổn định và nâng vai; tham gia trong shrug, row, deadlift.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='back'),1,20,TRUE,NOW(),NOW()),
      ('Cơ hình thoi','Rhomboids','rhomboids','Kéo xương bả vai về gần cột sống; quan trọng cho tư thế và động tác row.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='back'),1,30,TRUE,NOW(),NOW()),
      ('Dựng gai lưng','Erector Spinae','erector-spinae','Nhóm cơ dọc cột sống giúp duỗi lưng và giữ lưng thẳng; hoạt động mạnh trong deadlift, good morning.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='back'),1,40,TRUE,NOW(),NOW()),
      ('Tròn to','Teres Major','teres-major','Hỗ trợ xoay trong và khép vai; tham gia trong các biến thể kéo/row.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='back'),1,50,TRUE,NOW(),NOW()),

      -- Shoulders
      ('Cơ vai trước','Anterior Deltoid','anterior-deltoid','Nâng cánh tay ra trước; tham gia mạnh trong shoulder press, front raise, bench press.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='shoulders'),1,10,TRUE,NOW(),NOW()),
      ('Cơ vai giữa','Lateral Deltoid','lateral-deltoid','Dang tay sang ngang; chủ đạo trong lateral raise, overhead press.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='shoulders'),1,20,TRUE,NOW(),NOW()),
      ('Cơ vai sau','Posterior Deltoid','posterior-deltoid','Kéo tay ra sau/ngoài; quan trọng cho face pull, reverse fly, row cao.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='shoulders'),1,30,TRUE,NOW(),NOW()),
      ('Chóp xoay','Rotator Cuff','rotator-cuff','Nhóm cơ ổn định khớp vai (supraspinatus, infraspinatus, teres minor, subscapularis); quan trọng trong xoay trong/ngoài.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='shoulders'),1,40,TRUE,NOW(),NOW()),
      ('Răng trước','Serratus Anterior','serratus-anterior','Ổn định và xoay lên xương bả vai; hoạt động trong push-up plus, overhead reach.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='shoulders'),1,50,TRUE,NOW(),NOW()),

      -- Arms
      ('Nhị đầu cánh tay','Biceps Brachii','biceps-brachii','Gập khuỷu tay và xoay ngửa cẳng tay; hoạt động trong curl, chin-up.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,10,TRUE,NOW(),NOW()),
      ('Cánh tay trước (Brachialis)','Brachialis','brachialis','Nằm dưới biceps; mạnh trong gập khuỷu tay trung lập/tiên thiên, hammer curl.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,20,TRUE,NOW(),NOW()),
      ('Cánh tay quay (Brachioradialis)','Brachioradialis','brachioradialis','Cơ cẳng tay hỗ trợ gập khuỷu tay, đặc biệt với nắm trung lập (hammer).',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,30,TRUE,NOW(),NOW()),
      ('Tam đầu cánh tay','Triceps Brachii','triceps-brachii','Duỗi khuỷu tay; chủ đạo trong pushdown, dips, close-grip bench.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,40,TRUE,NOW(),NOW()),
      ('Gấp cổ tay','Wrist Flexors','wrist-flexors','Nhóm cơ gấp cổ tay và hỗ trợ lực nắm; hoạt động trong wrist curl, grip work.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,50,TRUE,NOW(),NOW()),
      ('Duỗi cổ tay','Wrist Extensors','wrist-extensors','Nhóm cơ duỗi cổ tay; cân bằng cổ tay/forearm, hoạt động trong reverse wrist curl.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='arms'),1,60,TRUE,NOW(),NOW()),

      -- Core
      ('Cơ thẳng bụng','Rectus Abdominis','rectus-abdominis','Gập thân và chống ưỡn; hoạt động trong crunch, hollow hold, leg raise.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='core'),1,10,TRUE,NOW(),NOW()),
      ('Cơ chéo bụng','Obliques','obliques','Xoay/lệch thân, chống nghiêng; quan trọng trong side plank, woodchop, rotation.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='core'),1,20,TRUE,NOW(),NOW()),
      ('Cơ ngang bụng','Transversus Abdominis','transversus-abdominis','Tạo áp lực ổn định thân (core bracing); nền tảng cho nâng tạ an toàn.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='core'),1,30,TRUE,NOW(),NOW()),

      -- Legs
      ('Tứ đầu đùi','Quadriceps','quadriceps','Duỗi gối; chủ đạo trong squat, lunge, leg extension.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,10,TRUE,NOW(),NOW()),
      ('Gân kheo','Hamstrings','hamstrings','Gập gối và duỗi hông; hoạt động trong RDL, leg curl, hip hinge.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,20,TRUE,NOW(),NOW()),
      ('Mông lớn','Gluteus Maximus','gluteus-maximus','Duỗi và xoay ngoài hông; chủ đạo trong hip thrust, deadlift, squat.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,30,TRUE,NOW(),NOW()),
      ('Mông trung','Gluteus Medius','gluteus-medius','Dang và ổn định hông; quan trọng trong single-leg work, lateral band walk.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,40,TRUE,NOW(),NOW()),
      ('Mông bé','Gluteus Minimus','gluteus-minimus','Hỗ trợ dang/ổn định hông cùng glute med; kiểm soát valgus gối.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,50,TRUE,NOW(),NOW()),
      ('Khép háng','Hip Adductors','hip-adductors','Khép đùi; bổ trợ lực trong squat, chạy và giữ cân bằng hông.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,60,TRUE,NOW(),NOW()),
      ('Gập háng','Hip Flexors','hip-flexors','Gập hông; tham gia nâng gối, sprint, hỗ trợ kiểm soát tư thế.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,70,TRUE,NOW(),NOW()),
      ('Cơ bụng chân (Gastrocnemius)','Gastrocnemius','gastrocnemius','Cơ bắp chân lớn; duỗi cổ chân và hỗ trợ gập gối; hoạt động trong calf raise.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,80,TRUE,NOW(),NOW()),
      ('Cơ dép (Soleus)','Soleus','soleus','Cơ bắp chân sâu; duỗi cổ chân khi gối gập; chủ đạo trong seated calf raise.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,90,TRUE,NOW(),NOW()),
      ('Chày trước','Tibialis Anterior','tibialis-anterior','Kéo mũi chân lên (gấp mu chân); quan trọng cho ổn định cổ chân, chạy.',(SELECT muscle_group_id FROM muscle_groups WHERE slug='legs'),1,100,TRUE,NOW(),NOW())
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        name_en = EXCLUDED.name_en,
        description = EXCLUDED.description,
        parent_id = EXCLUDED.parent_id,
        level = EXCLUDED.level,
        display_priority = EXCLUDED.display_priority,
        is_selectable = EXCLUDED.is_selectable,
        updated_at = NOW();
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
      DELETE FROM muscle_groups WHERE slug IN (
        'upper-chest','mid-chest','lower-chest',
        'latissimus-dorsi','trapezius','rhomboids','erector-spinae','teres-major',
        'anterior-deltoid','lateral-deltoid','posterior-deltoid','rotator-cuff','serratus-anterior',
        'biceps-brachii','brachialis','brachioradialis','triceps-brachii','wrist-flexors','wrist-extensors',
        'rectus-abdominis','obliques','transversus-abdominis',
        'quadriceps','hamstrings','gluteus-maximus','gluteus-medius','gluteus-minimus','hip-adductors','hip-flexors','gastrocnemius','soleus','tibialis-anterior'
      );
    `, { transaction: t });
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

