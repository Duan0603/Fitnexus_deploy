export async function up(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    const qi = queryInterface;
    const q = qi.sequelize;

    async function ensureStep(stepKey, title, orderIndex) {
      await q.query(
        `INSERT INTO onboarding_steps (step_key, title, order_index, is_active, created_at, updated_at)
         VALUES (:stepKey, :title, :orderIndex, true, NOW(), NOW())
         ON CONFLICT (step_key) DO UPDATE SET
           title = EXCLUDED.title,
           order_index = EXCLUDED.order_index,
           is_active = EXCLUDED.is_active,
           updated_at = EXCLUDED.updated_at;`,
        { transaction: t, replacements: { stepKey, title, orderIndex } }
      );

      const [rows] = await q.query(
        `SELECT step_id FROM onboarding_steps WHERE step_key = :stepKey LIMIT 1;`,
        { transaction: t, replacements: { stepKey } }
      );
      const stepId = rows?.[0]?.step_id;
      if (!stepId) throw new Error(`seed onboarding: step_id not found for ${stepKey}`);
      return stepId;
    }

    async function upsertField(stepId, fieldKey, label, inputType, required, orderIndex, metadata) {
      await q.query(
        `INSERT INTO onboarding_fields
           (step_id, field_key, label, input_type, required, order_index, metadata, created_at, updated_at)
         VALUES
           (:stepId, :fieldKey, :label, :inputType, :required, :orderIndex, :metadata::jsonb, NOW(), NOW())
         ON CONFLICT (step_id, field_key)
         DO UPDATE SET label = EXCLUDED.label,
                       input_type = EXCLUDED.input_type,
                       required = EXCLUDED.required,
                       order_index = EXCLUDED.order_index,
                       metadata = EXCLUDED.metadata,
                       updated_at = EXCLUDED.updated_at;`,
        {
          transaction: t,
          replacements: {
            stepId,
            fieldKey,
            label,
            inputType,
            required,
            orderIndex,
            metadata: JSON.stringify(metadata || {}),
          },
        }
      );
    }

    // 1) BODY TYPE
    const bodyTypeId = await ensureStep("body_type", "Chọn thể trạng cơ thể", 2);
    await upsertField(bodyTypeId, "body_type", "Thể trạng", "radio", true, 1, {
      ui: { variant: "card" },
      options: [
        { key: "SKINNY", label: "Gầy" },
        { key: "NORMAL", label: "Bình thường" },
        { key: "OVERWEIGHT", label: "Thừa cân" },
        { key: "MUSCULAR", label: "Cơ bắp" },
      ],
    });

    // 2) GOAL
    const goalId = await ensureStep("goal", "Mục tiêu của bạn", 3);
    await upsertField(goalId, "goal", "Mục tiêu", "radio", true, 1, {
      ui: { variant: "card" },
      options: [
        { key: "LOSE_FAT", label: "Giảm mỡ" },
        { key: "BUILD_MUSCLE", label: "Tăng cơ" },
        { key: "MAINTAIN", label: "Duy trì" },
      ],
    });

    // 3) WEIGHT
    const weightId = await ensureStep("weight", "Cân nặng hiện tại", 4);
    await upsertField(weightId, "weight_kg", "Cân nặng (kg)", "number", true, 1, {
      min: 30,
      max: 300,
      step: 0.1,
      unit: "kg",
      placeholder: 70,
      mapTo: { model: "user_progress", column: "weight" },
    });

    // 4) HEIGHT
    const heightId = await ensureStep("height", "Chiều cao", 5);
    await upsertField(heightId, "height_cm", "Chiều cao (cm)", "number", true, 1, {
      min: 120,
      max: 230,
      step: 0.5,
      unit: "cm",
      placeholder: 170,
      mapTo: { model: "user_progress", column: "height" },
    });

    // 5) LEVEL BODY FAT
    const bfLevelId = await ensureStep("level_body_fat", "Mức độ mỡ cơ thể", 6);
    await upsertField(bfLevelId, "body_fat_level", "Mức mỡ", "radio", true, 1, {
      ui: { variant: "card" },
      options: [
        { key: "VERY_LOW", label: "Rất thấp" },
        { key: "LOW", label: "Thấp" },
        { key: "NORMAL", label: "Bình thường" },
        { key: "HIGH", label: "Cao" },
      ],
      mapTo: { model: "user_progress", column: "body_fat_level" },
    });

    // 6) EXPERIENCE LEVEL
    const expLevelId = await ensureStep("experience_level", "Kinh nghiệm tập luyện", 7);
    await upsertField(expLevelId, "experience_level", "Kinh nghiệm", "select", true, 1, {
      options: [
        { key: "BEGINNER", label: "Mới bắt đầu" },
        { key: "INTERMEDIATE", label: "Trung cấp" },
        { key: "ADVANCED", label: "Nâng cao" },
      ],
    });

    // 7) WORKOUT FREQUENCY
    const freqId = await ensureStep("workout_frequency", "Số buổi/tuần", 8);
    await upsertField(freqId, "workout_days_per_week", "Số buổi mỗi tuần", "select", true, 1, {
      options: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ key: String(n), label: `${n} buổi/tuần` })),
    });

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

export async function down(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    const qi = queryInterface;
    const q = qi.sequelize;
    const keys = [
      'body_type', 'goal', 'weight', 'height', 'level_body_fat', 'experience_level', 'workout_frequency'
    ];

    // Delete answers first (FK)
    await q.query(
      `DELETE FROM onboarding_answers WHERE step_id IN (
         SELECT step_id FROM onboarding_steps WHERE step_key = ANY(:keys)
       );`,
      { transaction: t, replacements: { keys } }
    );

    // Delete fields, then steps
    await q.query(
      `DELETE FROM onboarding_fields WHERE step_id IN (
         SELECT step_id FROM onboarding_steps WHERE step_key = ANY(:keys)
       );`,
      { transaction: t, replacements: { keys } }
    );

    await q.query(
      `DELETE FROM onboarding_steps WHERE step_key = ANY(:keys);`,
      { transaction: t, replacements: { keys } }
    );

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

