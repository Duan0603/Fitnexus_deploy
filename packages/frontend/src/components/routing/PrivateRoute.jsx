import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import { api } from "../../lib/api";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checked, setChecked] = React.useState(false);
  const [redirectTo, setRedirectTo] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (loading) return;
      if (!user) { setChecked(true); return; }

      try {
        const r = await api.get("/api/onboarding/session", {
          params: { t: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          withCredentials: true,
        });
        if (!mounted) return;
        const d = r?.data?.data || {};
        if (d.required && !d.completed && !d.complete) {
          const step = String(d.nextStepKey || d.currentStepKey || "age").toLowerCase();
          setRedirectTo(`/onboarding/${step}`);
        }
      } finally {
        if (mounted) setChecked(true);
      }
    })();
    return () => { mounted = false; };
  }, [user, loading]);

  if (loading || !checked) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (redirectTo) return <Navigate to={redirectTo} replace state={{ from: location }} />;
  return children;
}
