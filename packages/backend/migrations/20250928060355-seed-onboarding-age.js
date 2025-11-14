export async function up(queryInterface) {
  const t = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.sequelize.query(`
      INSERT INTO onboarding_steps (step_key, title, order_index, is_active, created_at, updated_at)
      VALUES ('age', 'Chọn độ tuổi của bạn', 1, true, NOW(), NOW())
      ON CONFLICT (step_key) DO UPDATE SET
        title = EXCLUDED.title,
        order_index = EXCLUDED.order_index,
        is_active = EXCLUDED.is_active,
        updated_at = EXCLUDED.updated_at;
    `, { transaction: t });

    const [rows] = await queryInterface.sequelize.query(
      "SELECT step_id from onboarding_steps where step_key='age' LIMIT 1;",
      { transaction : t }
    );

    const stepId = rows?.[0]?.step_id;
    if (!stepId) throw new Error("seed-age: step_id not found");

    const metadata = {
      ui: { variant: "card" },
      options: [
        { key: "AGE_16_29", label: "16–29", min: 16, max: 29, image: "/images/age-young.png" },
        { key: "AGE_30_39", label: "30–39", min: 30, max: 39, image: "/images/age-adult.png" },
        { key: "AGE_40_49", label: "40–49", min: 40, max: 49, image: "/images/age-middle.png" },
        { key: "AGE_50_PLUS", label: "50+", min: 50, max: null, image: "/images/age-senior.png" }
      ]
    };

    await queryInterface.sequelize.query(`
      INSERT INTO onboarding_fields
        (step_id, field_key, label, input_type, required, order_index, metadata, created_at, updated_at)
      VALUES
        (:stepId, 'age_group', 'Độ tuổi', 'radio', true, 1, :metadata::jsonb, NOW(), NOW())
      ON CONFLICT (step_id, field_key)
      DO UPDATE SET label=EXCLUDED.label,
                    input_type=EXCLUDED.input_type,
                    required=EXCLUDED.required,
                    order_index=EXCLUDED.order_index,
                    metadata=EXCLUDED.metadata,
                    updated_at=EXCLUDED.updated_at;
    `, { transaction: t, replacements: { stepId, metadata: JSON.stringify(metadata) } });
    
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
    }
}

export async function down() {
  const t = await queryInterface.sequelize.transaction();
  try { 
    // Xoá các câu trả lời của step 'age' (nếu có), rồi xoá field và step
    await queryInterface.sequelize.query(`
      DELETE FROM onboarding_answers WHERE step_id IN (SELECT step_id FROM onboarding_steps WHERE step_key='age');
    ` , { transaction: t });
    
    await queryInterface.sequelize.query(`
      DELETE FROM onboarding_fields
      WHERE step_id IN (SELECT step_id FROM onboarding_steps WHERE step_key='age')
        AND field_key='age_group';
    `, { transaction: t });
    
    await queryInterface.sequelize.query(`
      DELETE FROM onboarding_steps WHERE step_key='age';
    `, { transaction: t });
    
    await t.commit();
      
  } catch (err) {
    await t.rollback();
    throw err;
    }
}