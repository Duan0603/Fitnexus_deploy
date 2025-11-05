
import bcrypt from 'bcrypt'; 

export async function up(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();

  try {
    const now = new Date();
    const username = 'admin';
    const email = 'hoccuakiet@gmail.com';
    const phone = '0762700716';
    const rewPassword = 'Admin@123';

    const password_hash = await bcrypt.hash(rewPassword, 12);

    await queryInterface.sequelize.query(
      `
        INSERT INTO "users"
          ("username","email","password_hash","role","status",
          "provider","plan","phone","created_at","updated_at")
        VALUES
          (:username,:email,:password_hash,'ADMIN','ACTIVE','local','FREE',:phone,:created_at,:updated_at)
        ON CONFLICT ("username")
        DO UPDATE SET
          "email" = EXCLUDED."email",
          "password_hash" = EXCLUDED."password_hash",
          "role" = EXCLUDED."role",
          "status" = 'ACTIVE',
          "provider" = 'local',
          "phone" = EXCLUDED."phone",
          "updated_at" = EXCLUDED."updated_at";
      ` ,
      {
        replacements: {
          username,
          email,
          password_hash,
          phone,
          created_at: now,
          updated_at: now
        },
        transaction: t,
      }
    );

    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
export async function down(queryInterface, Sequelize) {
  const t = await queryInterface.sequelize.transaction();

  try {
    await queryInterface.bulkDelete(
      'users',
      { username : 'admin' },
      {transaction : t}
    );
    await t.commit();
  } catch (err) {
    await t.rollback();
    throw err;
  }
}