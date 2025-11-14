// Seed common subscription plans
export async function up(queryInterface, Sequelize) {
  const now = Sequelize.fn('NOW');
  const plans = [
    {
      name: 'Premium 1 tháng',
      slug: 'premium-1m',
      price: 99000, // VND
      duration_days: 30,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      name: 'Premium 3 tháng',
      slug: 'premium-3m',
      price: 249000,
      duration_days: 90,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    {
      name: 'Premium 12 tháng',
      slug: 'premium-12m',
      price: 799000,
      duration_days: 365,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
  ];

  // Avoid duplicates if re-run: upsert-like insert by filtering existing slugs
  const [rows] = await queryInterface.sequelize.query(
    "SELECT slug FROM subscription_plans WHERE slug IN (:slugs)",
    { replacements: { slugs: plans.map(p => p.slug) } }
  );
  const existing = new Set(rows.map(r => r.slug));
  const toInsert = plans.filter(p => !existing.has(p.slug));
  if (toInsert.length > 0) {
    await queryInterface.bulkInsert('subscription_plans', toInsert);
  }
}

export async function down(queryInterface) {
  await queryInterface.bulkDelete('subscription_plans', {
    slug: ['premium-1m', 'premium-3m', 'premium-12m']
  });
}

