// packages/frontend/src/components/routing/PermissionGate.jsx
import React from 'react';
import { useAuth } from '../../context/auth.context.jsx';

/**
 * Render children nếu user có permission yêu cầu; ngược lại render fallback.
 * @param {object} props
 * @param {string} props.required - ví dụ 'manage:users'
 * @param {React.ReactNode} props.children
 * @param {React.ReactNode} [props.fallbackComponent=null]
 */
const PermissionGate = ({ required, children, fallbackComponent = null }) => {
  const { userCan } = useAuth();
  if (userCan(required)) return <>{children}</>;
  return <>{fallbackComponent}</>;
};

export default PermissionGate;

