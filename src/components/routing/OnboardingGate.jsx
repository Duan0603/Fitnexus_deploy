import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function OnboardingGate({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api.get("/api/onboarding/session", {
          params: { t: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          withCredentials: true,
        });
        if (!mounted) return;
        const d = r?.data?.data || {};

        // ĐÃ xong onboarding → cho vào trang chủ (render children)
        if (!d.required || d.completed || d.complete) {
          setReady(true);
          return;
        }

        // CHƯA xong → đẩy tới bước đang dở
        const step = String(d.nextStepKey || d.currentStepKey || "").toLowerCase();
        navigate(`/onboarding/${step || "age"}`, { replace: true });
      } catch (e) {
        // Chưa đăng nhập → đưa về /login (tuỳ policy)
        if (e?.response?.status === 401) {
          navigate("/login", { replace: true, state: { from: location } });
          return;
        }
        // Lỗi khác: không chặn UI
        setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, [navigate, location]);

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
        Đang kiểm tra trạng thái onboarding...
      </div>
    );
  }
  return children;
}
