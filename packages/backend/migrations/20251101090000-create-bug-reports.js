/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("bug_reports", {
    report_id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "users", key: "user_id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    contact_email: { type: Sequelize.STRING(255), allowNull: true },
    title: { type: Sequelize.STRING(255), allowNull: false },
    description: { type: Sequelize.TEXT, allowNull: true },
    steps: { type: Sequelize.TEXT, allowNull: true },
    severity: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "medium",
    },
    status: {
      type: Sequelize.STRING(32),
      allowNull: false,
      defaultValue: "open",
    },
    screenshot_url: { type: Sequelize.TEXT, allowNull: true },
    admin_response: { type: Sequelize.TEXT, allowNull: true },
    responded_by: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "users", key: "user_id" },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    responded_at: { type: Sequelize.DATE, allowNull: true },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  // Create indexes if they do not already exist to make migration idempotent
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports (status)`
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports (severity)`
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_bug_reports_user ON bug_reports (user_id)`
  );
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS idx_bug_reports_created ON bug_reports (created_at)`
  );
}

export async function down(queryInterface) {
  // Drop indexes if they exist, then drop the table
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS idx_bug_reports_status`
  );
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS idx_bug_reports_severity`
  );
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS idx_bug_reports_user`
  );
  await queryInterface.sequelize.query(
    `DROP INDEX IF EXISTS idx_bug_reports_created`
  );
  await queryInterface.dropTable("bug_reports");
}
