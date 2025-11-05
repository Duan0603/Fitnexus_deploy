export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('password_resets', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    expires_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    used_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW'),
    },
  });

  // Indexes for lookup and uniqueness
  await queryInterface.addIndex('password_resets', ['user_id'], {
    name: 'password_resets_user_id_idx',
  });
  await queryInterface.addIndex('password_resets', ['token_hash'], {
    name: 'password_resets_token_hash_idx',
    //unique: true,
  });
  await queryInterface.addIndex('password_resets', ['expires_at'], {
    name: 'password_resets_expires_at_idx',
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('password_resets');
}

