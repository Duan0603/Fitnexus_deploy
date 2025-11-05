// models/passwordReset.model.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const PasswordReset = sequelize.define(
  "PasswordReset",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // FK sẽ được thiết lập ở migration; quan hệ được gắn trong associate()
    },

    token_hash: {
      type: DataTypes.TEXT,
      allowNull: false, // Lưu SHA-256(token), KHÔNG lưu token thô
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: false, // TTL (ví dụ 15–30 phút)
    },

    used_at: {
      type: DataTypes.DATE,
      allowNull: true, // null nếu chưa dùng
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "password_resets",
    timestamps: false, // đã có created_at, không dùng updatedAt
    indexes: [
      { fields: ["user_id"], name: "idx_password_resets_user_id" },
      { fields: ["token_hash"], name: "idx_password_resets_token_hash" },
    ],
  }
);

/**
 * Gắn quan hệ trong models/index.js sau khi load tất cả model:
 * PasswordReset.belongsTo(models.User, { foreignKey: 'user_id', targetKey: 'user_id', onDelete: 'CASCADE' });
 */
PasswordReset.associate = (models) => {
  if (models?.User) {
    PasswordReset.belongsTo(models.User, {
      foreignKey: "user_id",
      targetKey: "user_id",
      onDelete: "CASCADE",
    });
  }
};

export default PasswordReset;
