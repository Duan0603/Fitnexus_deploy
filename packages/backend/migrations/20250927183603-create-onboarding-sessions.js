export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("onboarding_sessions", {
    session_id: { type: Sequelize.UUID, primaryKey: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "users", key: "user_id" },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    current_step_key: { type: Sequelize.STRING(50), allowNull: true },
    is_completed: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    completed_at: { type: Sequelize.DATE, allowNull: true },
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
  await queryInterface.addIndex("onboarding_sessions", ["user_id"], {
    name: "onboarding_sessions_user_idx",
  });
  await queryInterface.addIndex("onboarding_sessions", ["is_completed"], {
    name: "onboarding_sessions_completed_idx",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("onboarding_sessions");
}
