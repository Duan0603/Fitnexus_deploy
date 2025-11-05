import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress";
import { submitOnboardingAnswer } from "../../lib/onboarding";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";


export default function OnboardingExperience() {
  useOnboardingGuard("experience_level"); // ép vào đúng bước đang dở
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);
  const navigate = useNavigate();
  const { refreshUser, markOnboarded } = useAuth();

  // Khớp seed backend: BEGINNER | INTERMEDIATE | ADVANCED
  const OPTIONS = [
    { label: "Mới bắt đầu", value: "BEGINNER", desc: "Chưa tập hoặc mới làm quen" },
    { label: "Trung cấp",   value: "INTERMEDIATE", desc: "Tập đều đặn 6–18 tháng" },
    { label: "Nâng cao",    value: "ADVANCED", desc: "Kinh nghiệm > 18 tháng" },
  ];

  const chonExperience = async (level) => {
    if (dangLuu) return;
    setLoi(null);
    setDangLuu(true);

    try {
    //    const res = await api.post("/api/onboarding/steps/experience_level/answer", {
    //    answers: { experience_level: level },
    //  });
    //  const next = res?.data?.data?.nextStepKey;
    //  if (next) {
    //   // Điều hướng sang bước kế tiếp do backend quyết định
    //    navigate(`/onboarding/${next}`, { replace: true });
    //  } else {
    //    // Không còn bước → hoàn tất onboarding
    //    await refreshUser();
    //    try { markOnboarded(); } catch {}
    //    navigate("/", { replace: true });
    //  }

    await submitOnboardingAnswer({
       stepKey: "experience_level",
       answers: { experience_level: level },
       navigate,
       refreshUser,
       markOnboarded,
    });
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (experience_level)."
          : status === 422
          ? "Giá trị không hợp lệ. Hãy chọn lại."
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
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Kinh nghiệm tập luyện
            </h1>
            <p className="mt-2 text-gray-500">
              Chọn mức độ phù hợp để cá nhân hoá cường độ và khối lượng tập.
            </p>

            {/* Tiến trình động theo flow */}
            <div className="mt-4">
              <OnboardingProgress currentKey="experience_level" />
            </div>
          </div>

          {/* Lựa chọn (card) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={dangLuu}
                onClick={() => chonExperience(opt.value)}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed text-left"
              >
                <div className="p-5">
                  <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {opt.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Lỗi */}
          {loi && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
              {loi}
            </div>
          )}
        </div>
      </div>

      {/* Overlay loading */}
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
