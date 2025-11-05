export async function up(queryInterface, Sequelize) {
  // Add user_exp_date: subscription expiration date
  await queryInterface.addColumn("users", "user_exp_date", {
    type: Sequelize.DATE,
    allowNull: true,
  });

  // Add user_type with strict default 'free'
  await queryInterface.addColumn("users", "user_type", {
    type: Sequelize.STRING(32),
    allowNull: false,
    defaultValue: 'free',
  });

  // Backfill existing rows to 'free' just in case (for some dialects default doesn't retro-apply)
  await queryInterface.sequelize.query("UPDATE users SET user_type = 'free' WHERE user_type IS NULL");

  // Indexes
  await queryInterface.addIndex("users", ["user_exp_date"], {
    name: "users_user_exp_date_idx",
  });

  await queryInterface.addIndex("users", ["user_type"], {
    name: "users_user_type_idx",
  });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex("users", "users_user_type_idx").catch(() => {});
  await queryInterface.removeIndex("users", "users_user_exp_date_idx").catch(() => {});
  await queryInterface.removeColumn("users", "user_type");
  await queryInterface.removeColumn("users", "user_exp_date");
}
