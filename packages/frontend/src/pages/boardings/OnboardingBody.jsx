// packages/frontend/src/pages/boardings/OnboardingBody.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";

export default function OnboardingBody() {
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);
  const navigate = useNavigate();
  const { refreshUser, markOnboarded } = useAuth();

  // Giá trị value phải khớp seed backend: SKINNY | NORMAL | OVERWEIGHT | MUSCULAR
  const OPTIONS = [
    { label: "Gầy (Slim)",        value: "SKINNY",     img: "/images/body-skinny.png" },
    { label: "Bình thường",       value: "NORMAL",     img: "/images/body-normal.png" },
    { label: "Thừa cân (Heavy)",  value: "OVERWEIGHT", img: "/images/body-overweight.png" },
    { label: "Cơ bắp (Muscular)", value: "MUSCULAR",   img: "/images/body-muscular.png" },
  ];

  const chonBodyType = async (bodyType) => {
    if (dangLuu) return;
    setLoi(null);
    setDangLuu(true);

    try {
      const res = await api.post("/api/onboarding/steps/body_type/answer", {
        answers: { body_type: bodyType },
      });

      // ✅ Điều hướng theo phản hồi từ BE
      const data = res?.data?.data || {};
      const next = data.nextStepKey;
      const completed = !!(data.completed || data.complete || !next);

      if (completed) {
        // Hết tất cả bước -> refresh, đánh dấu đã onboard và vào Dashboard
        try { await refreshUser(); } catch {}
        try { markOnboarded(); } catch {}
        navigate("/dashboard", { replace: true });
      } else {
        // Còn bước -> đi tiếp bước đang dở
        navigate(`/onboarding/${next}`, { replace: true });
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (body_type)."
          : status === 422
          ? "Giá trị body_type không hợp lệ. Hãy chọn lại."
          : "Không thể lưu lựa chọn, vui lòng thử lại.");
      setLoi(msg);
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <div className="w-screen min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Card lớn toàn chiều ngang (không chia 2 cột) */}
        <div className="bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 p-6 md:p-10">
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-500">FitNexus</div>
            <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
              Chọn thể trạng cơ thể
            </h1>
            <p className="mt-2 text-gray-500">
              Cá nhân hoá bài tập &amp; dinh dưỡng phù hợp với bạn.
            </p>

            <OnboardingProgress currentKey="body_type" />
          </div>

          {/* Lựa chọn thể trạng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={dangLuu}
                onClick={() => chonBodyType(opt.value)}
                className="group relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="p-5 pr-28 text-left">
                  <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                    {opt.label}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Gợi ý lịch tập &amp; macro theo thể trạng
                  </div>
                </div>

                {/* Hình minh hoạ nhỏ góc phải của từng item */}
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
