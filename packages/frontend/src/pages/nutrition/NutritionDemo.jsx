import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";

import B1 from "../../assets/nutrition/B1.png";
import B2 from "../../assets/nutrition/B2.png";
import B3 from "../../assets/nutrition/B3.png";
import B4 from "../../assets/nutrition/B4.png";
import B5 from "../../assets/nutrition/B5.png";
import B6 from "../../assets/nutrition/B6.png";
import B7 from "../../assets/nutrition/B7.png";
import { BarChart3Icon } from "lucide-react";

export default function NutritionDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? <HeaderLogin /> : <HeaderDemo />}

      <main className="max-w-6xl px-4 py-10 mx-auto">
        {/* HERO */}
        <section className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
            Nutrition AI – Nhận diện món ăn & cá nhân hoá
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trợ lý dinh dưỡng thông minh
          </h1>
          <p className="mt-4 text-gray-700">
            Tải ảnh món ăn hoặc chọn từ thư viện, hệ thống nhận diện, ước tính
            khẩu phần, tính calo và macro. Thiết lập mục tiêu để cá nhân hoá
            lượng nạp, gợi ý thực đơn và danh sách mua sắm phù hợp.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-3">
            <div className="p-4 bg-white border rounded-xl border-emerald-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Nhận diện món
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Ảnh → tên món ăn, top dự đoán.
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-emerald-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Tính calo & macro
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Theo khẩu phần, quy đổi ra P/C/F.
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-emerald-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Cá nhân hoá mục tiêu
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Theo cân nặng, mục tiêu, sở thích.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={() =>
                isAuthenticated
                  ? navigate("/nutrition-ai")
                  : navigate("/login", { state: { from: "/nutrition-ai" } })
              }
              className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {isAuthenticated ? "Mở Nutrition AI" : "Đăng nhập để trải nghiệm"}
            </button>
          </div>
        </section>

        {/* QUY TRÌNH CHI TIẾT */}
        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-xl font-semibold text-gray-900">
            Quy trình sử dụng
          </h2>
          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
            {/* B1: Tải ảnh */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 1 — Tải ảnh món ăn
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Ảnh
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Chọn ảnh rõ nét, đủ ánh sáng. Hệ thống tự cắt căn giữa món ăn để
                nhận diện tốt hơn.
              </p>
              <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                <img
                  src={B1}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
              </div>
            </div>

            {/* B2: Nhận diện top dự đoán */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 2 — Nhận diện món ăn
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Dự đoán
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Hiển thị top 3 kết quả có xác suất cao nhất. Chọn đúng món để
                xem chi tiết dinh dưỡng.
              </p>
              <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                <img
                  src={B2}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
              </div>
            </div>

            {/* B3: Điều chỉnh khẩu phần */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 3 — Điều chỉnh khẩu phần
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Khẩu phần
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Chọn size nhỏ/vừa/lớn hoặc nhập gram để tính calo & tỉ lệ macro
                chính xác.
              </p>
              <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                <img
                  src={B3}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
              </div>
            </div>

            {/* B4: Macro breakdown */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 4 — Thành phần dinh dưỡng
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Macro
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Bảng macro chi tiết theo 100g quy đổi, tỉ lệ P/C/F và tổng kcal.
              </p>
              <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                <img
                  src={B4}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
              </div>
            </div>

            {/* B5: Cá nhân hoá */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 5 — Cá nhân hoá mục tiêu
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Mục tiêu
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Thiết lập mục tiêu (giảm mỡ/tăng cơ), mức độ hoạt động, hạn chế
                thực phẩm để gợi ý thực đơn phù hợp.
              </p>
              <div className="mt-4 overflow-hidden border-2 border-dashed rounded-xl border-emerald-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                  <img
                    src={B5}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* B6: Gợi ý thực đơn */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 6 — Gợi ý thực đơn
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Thực đơn
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Lên thực đơn ngày/tuần với macro mục tiêu, cho phép thay thế món
                linh hoạt.
              </p>
              <div className="mt-4 overflow-hidden border-2 border-dashed rounded-xl border-emerald-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                  <img
                    src={B6}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* B7: Danh sách mua sắm */}
            <div className="p-5 bg-white border rounded-2xl border-emerald-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 7 — Danh sách mua sắm
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  Shopping
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Tổng hợp nguyên liệu theo ngày/tuần, dễ chia sẻ và lưu trữ.
              </p>
              <div className="mt-4 overflow-hidden border-2 border-dashed rounded-xl border-emerald-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-120 bg-rose-50/40 sm:p-4">
                  <img
                    src={B7}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BẢO MẬT & NGUỒN DỮ LIỆU */}
        <section className="max-w-4xl p-5 mx-auto mt-16 border rounded-2xl border-emerald-200/70 bg-emerald-50/30">
          <h2 className="text-xl font-semibold text-gray-900">
            Bảo mật & nguồn dữ liệu
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Ảnh được xử lý tại trình duyệt khi có thể; dữ liệu dinh dưỡng được
            tổng hợp từ nguồn uy tín và được chuẩn hoá để đảm bảo tính nhất
            quán. Bạn có thể xoá dữ liệu bất cứ lúc nào.
          </p>
        </section>

        {/* CTA CUỐI TRANG */}
        <section className="max-w-3xl mx-auto text-center mt-14">
          <button
            onClick={() =>
              isAuthenticated
                ? navigate("/nutrition-ai")
                : navigate("/login", { state: { from: "/nutrition-ai" } })
            }
            className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {isAuthenticated
              ? "Bắt đầu với Nutrition AI"
              : "Đăng nhập để bắt đầu"}
          </button>
          <p className="mt-3 text-xs text-gray-600">
            Mẹo: chụp ảnh rõ nét, cân đối ánh sáng; có thể nhập tay khẩu phần để
            tăng độ chính xác.
          </p>
        </section>
      </main>
    </div>
  );
}

