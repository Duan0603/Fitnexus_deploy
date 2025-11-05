import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";

export default function NotFoundRedirect() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) navigate("/dashboard", { replace: true });
    else navigate("/", { replace: true });
  }, [user, loading, navigate]);

  return null;
}

