// packages/backend/models/user.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import bcrypt from "bcrypt";

const User = sequelize.define(
  "User",
  {
    user_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },

    email: { type: DataTypes.STRING, allowNull: false, unique: true },

    passwordHash: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "password_hash",
    },

    fullName: { type: DataTypes.STRING(100), allowNull: true, field: "full_name" },

    phone: { type: DataTypes.STRING(20), allowNull: true, unique: true },

    avatarUrl: { type: DataTypes.STRING, allowNull: true, field: "avatar_url" },

    dateOfBirth: { type: DataTypes.DATE, allowNull: true, field: "date_of_birth" },

    gender: { type: DataTypes.ENUM("MALE", "FEMALE", "OTHER"), allowNull: true },

    provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "local" },

    providerId: { type: DataTypes.STRING, allowNull: true, field: "provider_id" },

    role: {
      type: DataTypes.ENUM("USER", "TRAINER", "ADMIN"),
      allowNull: false,
      defaultValue: "USER",
    },

    plan: {
      type: DataTypes.ENUM("FREE", "PREMIUM"),
      allowNull: false,
      defaultValue: "FREE",
    },

    // Subscription fields for SaaS billing
    user_type: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: 'free',
      field: 'user_type',
    },
    user_exp_date: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'user_exp_date',
    },

    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "BANNED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },

    lastLoginAt: { type: DataTypes.DATE, allowNull: true, field: "last_login_at" },
    lastActiveAt: { type: DataTypes.DATE, allowNull: true, field: "last_active_at" },

    onboardingCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "onboarding_completed_at",
    },

    login_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "login_streak",
    },
    max_login_streak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "max_login_streak",
    },
    login_streak_updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "login_streak_updated_at",
    },

    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_locked",
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "locked_at",
    },
    lockReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "lock_reason",
    },

    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_super_admin",
    },
    parentAdminId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "parent_admin_id",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      async beforeCreate(user) {
        if (user.passwordHash) {
          const saltRounds = 12;
          user.passwordHash = await bcrypt.hash(user.passwordHash, saltRounds);
        }
      },
      async beforeUpdate(user) {
        if (user.changed("passwordHash") && user.passwordHash) {
          const saltRounds = 12;
          user.passwordHash = await bcrypt.hash(user.passwordHash, saltRounds);
        }
      },
    },
    defaultScope: {
      // có thể thêm exclude nếu bạn muốn, để mình tự ẩn passwordHash ở toJSON dưới
    },
  }
);

User.prototype.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash;
  return values;
};

User.findByEmail = function (email) {
  return this.findOne({ where: { email } });
};

User.findByUsername = function (username) {
  return this.findOne({ where: { username } });
};

export default User;
