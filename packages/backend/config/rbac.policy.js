// packages/backend/config/rbac.policy.js

const permissions = {
  // Quyền user cơ bản
  USER: [
    'read:exercises',
    'read:own_profile',
    'update:own_profile',
    'use:ai_trainer', // Sẽ bị middleware `ai.quota.js` kiểm tra
  ],
  // Quyền user trả phí
  PREMIUM_USER: [
    'read:premium_exercises',
    'use:ai_trainer:unlimited', // Sẽ bypass `ai.quota.js`
  ],
  // Quyền của HLV
  TRAINER: [
    'create:plan',
    'manage:clients',
  ],
  // Quyền quản lý nội dung
  CONTENT_MANAGER: [
    'create:exercise',
    'update:exercise',
    'delete:exercise',
    'manage:content',
  ],
  // Quyền quản trị
  ADMIN: [
    'read:admin_dashboard',
    'manage:users', // (Bao gồm khóa/mở, đổi role)
  ],
  // Quyền cao nhất
  SUPER_ADMIN: ['*'], // Ký tự đại diện cho "tất cả"
};

// Tạo policy bằng cách kế thừa quyền
export const rbacPolicy = {
  guest: [], // Chưa đăng nhập
  user: [
    ...permissions.USER,
  ],
  premium_user: [ // Đây là "virtual role"
    ...permissions.USER,
    ...permissions.PREMIUM_USER,
  ],
  trainer: [
    ...permissions.USER,
    ...permissions.PREMIUM_USER, // Giả sử trainer luôn là premium
    ...permissions.TRAINER,
  ],
  content_manager: [
    ...permissions.USER,
    ...permissions.CONTENT_MANAGER,
  ],
  admin: [
    ...permissions.USER,
    ...permissions.PREMIUM_USER,
    ...permissions.TRAINER,
    ...permissions.CONTENT_MANAGER,
    ...permissions.ADMIN,
  ],
  super_admin: [
    ...permissions.SUPER_ADMIN,
  ],
};

/**
 * Hàm helper để kiểm tra quyền
 * @param {string} role - Vai trò của user (đã xử lý logic premium)
 * @param {string} permission - Quyền cần kiểm tra
 * @returns {boolean}
 */
export const can = (role, permission) => {
  const userPermissions = rbacPolicy[role];
  if (!userPermissions) return false;

  // Check super admin
  if (userPermissions.includes('*')) return true;

  // Check quyền cụ thể
  return userPermissions.includes(permission);
};

