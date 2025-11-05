// packages/backend/migrations/20251002113000-promote-super-admin.js
export async function up(queryInterface, Sequelize) {
  const EMAIL = 'hoccuakiet@gmail.com';
  await queryInterface.sequelize.query(`
    UPDATE users
    SET is_super_admin = TRUE,
        parent_admin_id = NULL,
        role = 'ADMIN',
        status = 'ACTIVE'
    WHERE email = '${EMAIL}';
  `);
}

export async function down(queryInterface, Sequelize) {
  const EMAIL = 'hoccuakiet@gmail.com';
  await queryInterface.sequelize.query(`
    UPDATE users
    SET is_super_admin = FALSE
    WHERE email = '${EMAIL}';
  `);
}
