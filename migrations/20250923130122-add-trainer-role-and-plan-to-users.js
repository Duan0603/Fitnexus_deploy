export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // 1) Add users.plan enum column (FREE | PREMIUM) with default FREE
    await queryInterface.addColumn(
      'users',
      'plan',
      {
        type: Sequelize.ENUM('FREE', 'PREMIUM'),
        allowNull: false,
        defaultValue: 'FREE',
      },
      { transaction }
    );
    // 2) Expand users.role enum to include TRAINER (Postgres-safe pattern)
    await queryInterface.sequelize.query(
      `DO $$
       BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_role_new') THEN
           CREATE TYPE "enum_users_role_new" AS ENUM ('USER','TRAINER','ADMIN');
         END IF;
       END$$;`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
       ALTER TABLE "users" ALTER COLUMN "role"
         TYPE "enum_users_role_new"
         USING ("role"::text::"enum_users_role_new");
       ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `DROP TYPE "enum_users_role";
       ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";`,
      { transaction }
    );
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
export async function down(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // 1) Remove users.plan and drop its enum type
    await queryInterface.removeColumn('users', 'plan', { transaction });
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_users_plan";`,
      { transaction }
    );
    // 2) Revert users.role enum back to USER | ADMIN
    // Map any TRAINER values to USER before shrinking enum
    await queryInterface.sequelize.query(
      `UPDATE "users" SET "role" = 'USER' WHERE "role" = 'TRAINER';`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `CREATE TYPE "enum_users_role_old" AS ENUM ('USER','ADMIN');`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
       ALTER TABLE "users" ALTER COLUMN "role"
         TYPE "enum_users_role_old"
         USING ("role"::text::"enum_users_role_old");
       ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';`,
      { transaction }
    );
    await queryInterface.sequelize.query(
      `DROP TYPE "enum_users_role";
       ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";`,
      { transaction }
    );
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}