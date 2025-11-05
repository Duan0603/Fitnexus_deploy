// packages/frontend/src/config/rbac.policy.js

const permissions = {
  USER: [
    'read:exercises',
    'read:own_profile',
    'update:own_profile',
    'use:ai_trainer',
  ],
  PREMIUM_USER: [
    'read:premium_exercises',
    'use:ai_trainer:unlimited',
  ],
  TRAINER: [
    'create:plan',
    'manage:clients',
  ],
  CONTENT_MANAGER: [
    'create:exercise',
    'update:exercise',
    'delete:exercise',
    'manage:content',
  ],
  ADMIN: [
    'read:admin_dashboard',
    'manage:users',
  ],
  SUPER_ADMIN: ['*'],
};

export const rbacPolicy = {
  guest: [],
  user: [...permissions.USER],
  premium_user: [...permissions.USER, ...permissions.PREMIUM_USER],
  trainer: [...permissions.USER, ...permissions.PREMIUM_USER, ...permissions.TRAINER],
  content_manager: [...permissions.USER, ...permissions.CONTENT_MANAGER],
  admin: [
    ...permissions.USER,
    ...permissions.PREMIUM_USER,
    ...permissions.TRAINER,
    ...permissions.CONTENT_MANAGER,
    ...permissions.ADMIN,
  ],
  super_admin: [...permissions.SUPER_ADMIN],
};

export const can = (role, permission) => {
  const perms = rbacPolicy[role];
  if (!perms) return false;
  if (perms.includes('*')) return true;
  return perms.includes(permission);
};

