// packages/frontend/src/pages/boarding/OnboardingGoal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";

export default function OnboardingGoal() {
  // Ép route khớp bước đang dở
  useOnboardingGuard("goal");
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);
  const navigate = useNavigate();
  const { refreshUser, markOnboarded } = useAuth();

  // Value phải khớp seed backend: LOSE_FAT | BUILD_MUSCLE | MAINTAIN
  const OPTIONS = [
    { label: "Giảm mỡ", value: "LOSE_FAT", img: "/images/goal-losefat.png" },
    { label: "Tăng cơ", value: "BUILD_MUSCLE", img: "/images/goal-muscle.png" },
    { label: "Duy trì", value: "MAINTAIN", img: "/images/goal-maintain.png" },
  ];

  const chonGoal = async (goal) => {
    if (dangLuu) return;
    setDangLuu(true);
    setLoi(null);

    try {
      const res = await api.post("/api/onboarding/steps/goal/answer", {
        answers: { goal },
      });

      const data = res?.data?.data || {};
      const next = data.nextStepKey;
      const completed = !!(data.completed || data.complete || !next);

      if (completed) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate(`/onboarding/${next}`, { replace: true });
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (goal)."
          : status === 422
          ? "Giá trị goal không hợp lệ. Hãy chọn lại."
          : "Không thể lưu lựa chọn, vui lòng thử lại.");
      setLoi(msg);
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 p-6 md:p-10">
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Mục tiêu tập luyện
            </h1>
            <p className="mt-2 text-gray-500">
              Chọn mục tiêu để hệ thống thiết kế lộ trình phù hợp nhất cho bạn.
            </p>

            {/* tiến trình giả định: Bước 3/?? */}
            <OnboardingProgress currentKey="goal" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={dangLuu}
                onClick={() => chonGoal(opt.value)}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60"
              >
                <div className="p-5 text-left">
                  <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Cá nhân hoá bài tập &amp; dinh dưỡng theo mục tiêu
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-28 h-24 sm:w-32 sm:h-28 bg-gray-100">
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

          {loi && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
              {loi}
            </div>
          )}
        </div>
      </div>

      {dangLuu && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="px-4 py-2 rounded-lg bg-white text-gray-700 border border-gray-200 shadow">
            Đang lưu lựa chọn...
          </div>
        </div>
      )}
    </div>
  );
}
