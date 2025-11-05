import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

export default function OnboardingWeight() {
  // Ép route khớp bước đang dở
  useOnboardingGuard("weight");
  const navigate = useNavigate();
  const [kg, setKg] = useState("");         // lưu raw text để người dùng nhập
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // min/max/step giống seed backend
  const MIN = 30;
  const MAX = 300;
  const STEP = 0.1;

  const parsed = useMemo(() => {
    if (kg === "" || kg === null) return null;
    const n = Number(kg);
    return Number.isFinite(n) ? n : null;
  }, [kg]);

  const valid = useMemo(() => {
    if (parsed === null) return false;
    return parsed >= MIN && parsed <= MAX;
  }, [parsed]);

  const format = (n) => (Number.isFinite(n) ? String(n) : "");

  const bump = (delta) => {
    setKg((prev) => {
      const curr = Number(prev);
      const base = Number.isFinite(curr) ? curr : 70; // mặc định
      const next = Math.min(MAX, Math.max(MIN, Math.round((base + delta) * 10) / 10));
      return format(next);
    });
  };

  const submit = async () => {
    if (!valid || saving) return;
    setErr(null);
    setSaving(true);
    try {
      const res = await api.post("/api/onboarding/steps/weight/answer", {
        answers: { weight_kg: parsed },
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
          ? "Chưa cấu hình bước onboarding (weight)."
          : status === 422
          ? "Giá trị cân nặng không hợp lệ. Hãy nhập lại."
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
              Cân nặng hiện tại
            </h1>
            <p className="mt-2 text-gray-500">
              Hãy nhập cân nặng của bạn để tối ưu hoá lịch tập &amp; dinh dưỡng.
            </p>
            <OnboardingProgress currentKey="weight" />
          </div>

          {/* Input number + nút +/- */}
          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Cân nặng (kg)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => bump(-STEP)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-sm"
                disabled={saving}
                title={`Giảm ${STEP} kg`}
              >
                −
              </button>

              <input
                inputMode="decimal"
                type="text"
                placeholder="70.0"
                value={kg}
                onChange={(e) => setKg(e.target.value.replace(",", "."))}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() => bump(+STEP)}
                className="px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-blue-500 hover:shadow-sm"
                disabled={saving}
                title={`Tăng ${STEP} kg`}
              >
                +
              </button>
            </div>

            <div className="text-xs text-gray-500">
              Khoảng hợp lệ: {MIN}–{MAX} kg • Bước: {STEP} kg
            </div>

            {!valid && kg !== "" && (
              <div className="text-sm text-red-600">
                Vui lòng nhập số từ {MIN} đến {MAX} kg.
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
