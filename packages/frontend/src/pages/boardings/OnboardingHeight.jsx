import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

export default function OnboardingHeight() {
  // Ép route khớp bước đang dở
  useOnboardingGuard("height");
  const navigate = useNavigate();
  const [cm, setCm] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Khớp metadata seed backend
  const MIN = 120;
  const MAX = 230;
  const STEP = 0.5;

  const parsed = useMemo(() => {
    if (cm === "" || cm === null) return null;
    const n = Number(cm);
    return Number.isFinite(n) ? n : null;
  }, [cm]);

  const valid = useMemo(() => {
    if (parsed === null) return false;
    return parsed >= MIN && parsed <= MAX;
  }, [parsed]);

  const format = (n) => (Number.isFinite(n) ? String(n) : "");

  const bump = (delta) => {
    setCm((prev) => {
      const curr = Number(prev);
      const base = Number.isFinite(curr) ? curr : 170; // mặc định
      const next = Math.min(
        MAX,
        Math.max(MIN, Math.round((base + delta) * 10) / 10)
      );
      return format(next);
    });
  };

  const submit = async () => {
    if (!valid || saving) return;
    setErr(null);
    setSaving(true);
    try {
      const res = await api.post("/api/onboarding/steps/height/answer", {
        answers: { height_cm: parsed },
      });
      const data = res?.data?.data || {};
      const next = data.nextStepKey;
      const completed = !!(data.completed || data.complete || !next);
      if (completed) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(`/onboarding/${next}`, { replace: true });
      }
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (height)."
          : status === 422
          ? "Giá trị chiều cao không hợp lệ. Hãy nhập lại."
          : "Không thể lưu lựa chọn, vui lòng thử lại.");
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 p-6 md:p-10">
          {/* Header + Progress */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Chiều cao của bạn
            </h1>
            <p className="mt-2 text-gray-500">
              Hãy nhập chiều cao của bạn để tối ưu hoá kế hoạch tập luyện &amp; dinh dưỡng.
            </p>
            <OnboardingProgress currentKey="height" />
          </div>

          {/* Input */}
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Chiều cao (cm)
            </label>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => bump(-STEP)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-sm"
                disabled={saving}
                title={`Giảm ${STEP} cm`}
              >
                −
              </button>

              <input
                inputMode="decimal"
                type="text"
                placeholder="170.0"
                value={cm}
                onChange={(e) => setCm(e.target.value.replace(",", "."))}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => bump(+STEP)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-sm"
                disabled={saving}
                title={`Tăng ${STEP} cm`}
              >
                +
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Khoảng hợp lệ: {MIN}–{MAX} cm • Bước: {STEP} cm
            </div>

            {!valid && cm !== "" && (
              <div className="text-sm text-red-600">
                Vui lòng nhập số từ {MIN} đến {MAX} cm.
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={!valid || saving}
                className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Tiếp tục"}
              </button>
            </div>

            {err && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                {err}
              </div>
            )}
          </div>
        </div>
      </div>

      {saving && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 shadow">
            Đang lưu lựa chọn...
          </div>
        </div>
      )}
    </div>
  );
}
