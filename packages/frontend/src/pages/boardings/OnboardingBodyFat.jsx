import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";

export default function OnboardingBodyFat() {
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);
  const navigate = useNavigate();
  const { refreshUser, markOnboarded } = useAuth();

  // Khớp seed backend: VERY_LOW | LOW | NORMAL | HIGH
  const OPTIONS = [
    { label: "Rất thấp",  value: "VERY_LOW",  img: "/images/bf-verylow.png" },
    { label: "Thấp",      value: "LOW",       img: "/images/bf-low.png" },
    { label: "Bình thường", value: "NORMAL",  img: "/images/bf-normal.png" },
    { label: "Cao",       value: "HIGH",      img: "/images/bf-high.png" },
  ];

  const chonBodyFat = async (value) => {
    if (dangLuu) return;
    setLoi(null);
    setDangLuu(true);

    try {
      const res = await api.post("/api/onboarding/steps/level_body_fat/answer", {
        answers: { body_fat_level: value },
      });

      const next = res?.data?.data?.nextStepKey;
      if (next) {
        navigate(`/onboarding/${next}`, { replace: true });
      } else {
        // Hết bước -> refresh + mark + về Home
        await refreshUser();
        try { markOnboarded(); } catch {}
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (level_body_fat)."
          : status === 422
          ? "Giá trị body_fat_level không hợp lệ. Hãy chọn lại."
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
          {/* Tiến trình động nếu bạn đã dùng OnboardingProgress */}
          <OnboardingProgress currentKey="level_body_fat" className="mb-6" />

          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Mức độ mỡ cơ thể
            </h1>
            <p className="mt-2 text-gray-500">
              Chọn mức mỡ cơ thể để tối ưu lịch tập và dinh dưỡng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={dangLuu}
                onClick={() => chonBodyFat(opt.value)}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="p-5 pr-28 text-left">
                  <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Gợi ý bài tập theo mức mỡ hiện tại
                  </div>
                </div>

                <div className="absolute right-0 bottom-0 w-28 h-24 sm:w-36 sm:h-28 bg-gray-100">
                  <img
                    src={opt.img}
                    alt={opt.label}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
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
