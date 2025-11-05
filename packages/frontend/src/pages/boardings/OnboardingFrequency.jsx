import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";
import { submitOnboardingAnswer } from "../../lib/onboarding";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

export default function OnboardingFrequency() {
    useOnboardingGuard("workout_frequency");
  const navigate = useNavigate();
  const { refreshUser, markOnboarded } = useAuth();
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const OPTIONS = [1, 2, 3, 4, 5, 6, 7].map((n) => ({
    label: `${n} buổi/tuần`,
    value: n,
    img: `/images/frequency-${n}.png`,
  }));

  const choose = async (days) => {
    if (saving) return;
    setErr(null);
    setSaving(true);
    try {
    //   // Gửi STRING để khớp metadata.options: ["1".."7"]
    //   const res = await api.post("/api/onboarding/steps/workout_frequency/answer", {
    //     answers: { workout_days_per_week: String(days) },
    //   });

    //   // ==> SỬA Ở ĐÂY: điều hướng theo phản hồi từ BE
    //   const next = res?.data?.data?.nextStepKey;
    //   const completed = !!(res?.data?.data?.completed || res?.data?.data?.complete || !next);

    //   if (completed) {
    //     // Hết tất cả bước → refresh & về Home
    //     try { await refreshUser(); } catch {}
    //     try { markOnboarded(); } catch {}
    //     navigate("/", { replace: true });
    //   } else {
    //     // Còn bước → nhảy sang bước đang dở
    //     navigate(`/onboarding/${next}`, { replace: true });
    //   }
    await submitOnboardingAnswer({
       stepKey: "workout_frequency",
       answers: { workout_days_per_week: String(days) }, // gửi string khớp options seed
       navigate,
       refreshUser,
      markOnboarded,
     });
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (workout_frequency)."
          : status === 422
          ? "Giá trị số buổi/tuần không hợp lệ. Hãy chọn lại."
          : "Không thể lưu lựa chọn, vui lòng thử lại.");
      setErr(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 p-6 md:p-10">
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Số buổi tập mỗi tuần
            </h1>
            <p className="mt-2 text-gray-500">
              Chọn tần suất tập luyện để tối ưu lịch tập &amp; phục hồi.
            </p>
            <OnboardingProgress currentKey="workout_frequency" />
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={saving}
                onClick={() => choose(opt.value)}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed text-left"
              >
                <div className="p-5 pr-28">
                  <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Hệ thống sẽ phân bổ bài tập &amp; ngày nghỉ phù hợp
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-28 h-24 sm:w-36 sm:h-28 bg-gray-100">
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {err && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
              {err}
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay */}
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
