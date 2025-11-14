
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    user_id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    full_name: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    avatar_url: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    date_of_birth: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    gender: {
      type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: true,
    },
    provider: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'local',
    },
    provider_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    role: {
      type: Sequelize.ENUM('USER', 'ADMIN'),
      allowNull: false,
      defaultValue: 'USER',
    },
    status: {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'BANNED'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
    last_login_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('users');
}
