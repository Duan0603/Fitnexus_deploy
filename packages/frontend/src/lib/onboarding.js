// packages/frontend/src/lib/onboarding.js
import { api, endpoints } from "./api";

/**
 * Gửi câu trả lời 1 step và điều hướng theo phản hồi BE:
 * - còn bước → /onboarding/:nextStepKey
 * - hết bước → "/"
 */
export async function submitOnboardingAnswer({
  stepKey,
  answers,
  navigate,
  refreshUser,   // từ useAuth()
  markOnboarded, // từ useAuth()
}) {
  const res = await api.post(`/api/onboarding/steps/${stepKey}/answer`, { answers });
  const data = res?.data?.data || {};
  const next = data.nextStepKey;
  const completed = !!(data.completed || data.complete || !next);

  if (completed) {
    try { await refreshUser?.(); } catch {}
    try { markOnboarded?.(); } catch {}
    navigate("/dashboard", { replace: true });
  } else {
    // Đặt cờ để bỏ qua guard một lần sau submit nhằm tránh loop
    navigate(`/onboarding/${next}`, { replace: true, state: { skipGuardOnce: true } });
  }
}
