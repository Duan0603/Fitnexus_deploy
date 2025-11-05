

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ⬇️ Giữ đường dẫn api/context như bạn đang dùng
import api from "../../lib/api";
import { useAuth } from "../../context/auth.context";
import OnboardingProgress from "../../components/OnboardingProgress.jsx";
import { submitOnboardingAnswer } from "../../lib/onboarding";
import { useOnboardingGuard } from "../../hooks/useOnboardingGuard";


export default function OnboardingAge() {
  const [dongYDieuKhoan, setDongYDieuKhoan] = useState(false);
  const [nhanMarketing, setNhanMarketing] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [loi, setLoi] = useState(null);


  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, markOnboarded } = useAuth();
  const returnTo = location.state?.from?.pathname || "/";

  // Đồng bộ route với bước đang dở; tránh redirect về home khi chưa xong
  useOnboardingGuard("age");


  const OPTIONS = [
    { label: "Tuổi: 16–29", value: "AGE_16_29", img: "/images/age-18-29.png" },
    { label: "Tuổi: 30–39", value: "AGE_30_39", img: "/images/age-30-39.png" },
    { label: "Tuổi: 40–49", value: "AGE_40_49", img: "/images/age-40-49.png" },
    { label: "Tuổi: 50+",   value: "AGE_50_PLUS", img: "/images/age-50.png" },
  ];


  const chonDoTuoi = async (ageGroup) => {
    // ✅ phải tích đủ 2 ô
    if (!dongYDieuKhoan || !nhanMarketing) {
      setLoi('Vui lòng tích đủ hai ô "Đồng ý Điều khoản" và "Nhận thông tin" trước khi tiếp tục.');
      return;
    }
    if (dangLuu) return;


    setLoi(null);
    setDangLuu(true);
    try {
      await submitOnboardingAnswer({
        stepKey: "age",
        answers: { age_group: ageGroup, marketing: nhanMarketing },
        navigate,
        refreshUser,
        markOnboarded,
      });
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        (status === 404
          ? "Chưa cấu hình bước onboarding (age)."
          : status === 422
          ? "Giá trị độ tuổi không hợp lệ. Hãy chọn lại."
          : "Không thể lưu lựa chọn, vui lòng thử lại.");
      setLoi(msg);
    } finally {
      setDangLuu(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Card tổng */}
        <div className="grid md:grid-cols-2 gap-10 bg-white rounded-3xl shadow-xl ring-1 ring-gray-200 p-6 md:p-10">
          {/* Cột trái: nội dung */}
          <div>
            {/* Logo/brand + tiêu đề */}
            <div className="mb-6">
              <div className="text-sm font-medium text-gray-500">FitNexus</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-extrabold tracking-tight">
                Chọn nhóm độ tuổi
              </h1>
              <p className="mt-2 text-gray-500">
                Hệ thống sẽ cá nhân hoá kế hoạch tập luyện theo độ tuổi &amp; BMI của bạn.
              </p>


              {/* tiến trình nhỏ */}
              <OnboardingProgress currentKey="age" />
            </div>


            {/* Lựa chọn độ tuổi (tông sáng, border xanh khi hover) */}
            <div className="space-y-4">
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={dangLuu}
                  onClick={() => chonDoTuoi(opt.value)}
                  className="w-full group flex items-center justify-between rounded-2xl border border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="p-5 text-left">
                    <div className="text-base font-semibold text-gray-800 group-hover:text-blue-700">
                      {opt.label}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Gợi ý bài tập &amp; dinh dưỡng tương ứng
                    </div>
                  </div>
                  <div className="w-36 h-28 bg-gray-100 rounded-r-2xl overflow-hidden">
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


            {/* Thông báo lỗi đẹp hơn */}
            {loi && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm px-4 py-3">
                {loi}
              </div>
            )}


            {/* Điều khoản & marketing */}
            <div className="mt-6 space-y-4 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={dongYDieuKhoan}
                  onChange={(e) => setDongYDieuKhoan(e.target.checked)}
                />
                <span className="text-gray-600">
                  Tiếp tục đồng nghĩa với việc bạn chấp nhận{" "}
                  <a href="#" onClick={(e)=>e.preventDefault()} className="font-medium text-blue-600 hover:underline">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#" onClick={(e)=>e.preventDefault()} className="font-medium text-blue-600 hover:underline">
                    Chính sách quyền riêng tư
                  </a>, cũng như{" "}
                  <a href="#" onClick={(e)=>e.preventDefault()} className="font-medium text-blue-600 hover:underline">
                    Chính sách cookie
                  </a>.
                </span>
              </label>


              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={nhanMarketing}
                  onChange={(e) => setNhanMarketing(e.target.checked)}
                />
                <span className="text-gray-600">
                  Tôi muốn nhận thông tin cập nhật về sản phẩm, dịch vụ và ưu đãi qua email.
                </span>
              </label>


              <p className="text-xs text-gray-500">
                Khuyến nghị tham vấn bác sĩ trước khi bắt đầu bất kỳ chương trình tập luyện nào.
              </p>
            </div>
          </div>


          {/* Cột phải: minh hoạ (giống layout login) */}
          <div className="hidden md:flex items-center justify-center">
            <div className="w-full h-full bg-gray-50 rounded-2xl ring-1 ring-gray-200 flex items-center justify-center">
              <img
                src="/images/onboarding-illustration.png"
                alt="Onboarding Illustration"
                className="max-w-[70%] h-auto"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          </div>
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



