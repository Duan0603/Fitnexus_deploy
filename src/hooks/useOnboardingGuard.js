import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api, { endpoints } from "../lib/api";

/**
 * useOnboardingGuard(expectedKey)
 * - Đồng bộ route với bước đang dở trên backend
 * - Idempotent, tránh loop
 * - Bỏ qua guard đúng 1 lần sau khi submit (state: { skipGuardOnce: true })
 */
export function useOnboardingGuard(expectedKey) {
  const navigate = useNavigate();
  const location = useLocation();

  const hasRedirectedRef = useRef(false); // chặn redirect nhiều lần
  const ranOnceRef = useRef(false);       // chặn Strict Mode double-invoke

  useEffect(() => {
    let cancelled = false;

    // Vừa điều hướng từ submit → bỏ qua guard 1 lần, clear state luôn
    if (location.state?.skipGuardOnce) {
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }

    // Tránh double-run do Strict Mode
    if (ranOnceRef.current) return;
    ranOnceRef.current = true;

    (async () => {
      try {
        const r = await api.get(endpoints.onboarding.session, {
          params: { t: Date.now() },
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
          withCredentials: true,
        });
        if (cancelled) return;

        const d = r?.data?.data || {};

        // Hoàn tất → về Home
        if (!d.required || d.completed || d.complete) {
          if (!hasRedirectedRef.current) {
            hasRedirectedRef.current = true;
            navigate("/", { replace: true });
          }
          return;
        }

        // Bước đang dở (normalize)
        const nextRaw = d.nextStepKey || d.currentStepKey || d.next || d.current || "";
        const next = String(nextRaw).toLowerCase();
        const cur  = String(expectedKey || "").toLowerCase();

        // Chỉ redirect khi khác bước hiện tại & chưa redirect
        if (next && next !== cur && !hasRedirectedRef.current) {
          hasRedirectedRef.current = true;
          navigate(`/onboarding/${next}`, { replace: true });
        }
        // Nếu trùng thì đứng yên → không loop
      } catch (e) {
        if (cancelled) return;
        if (e?.response?.status === 401) {
          navigate("/login", { replace: true, state: { from: location } });
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expectedKey]);
}
