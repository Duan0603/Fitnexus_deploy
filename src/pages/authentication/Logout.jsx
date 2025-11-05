import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";

export default function Logout() {
  const { logout } = useAuth();
  useEffect(() => {
    (async () => {
      try { await logout(); } catch {}
    })();
  }, [logout]);
  return <Navigate to="/" replace />;
}

