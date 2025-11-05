import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";
import aiGuider from "../../assets/aitrainer/B1.png";
import b2 from "../../assets/aitrainer/B2.png";
import b3 from "../../assets/aitrainer/B3.png";
import b31 from "../../assets/aitrainer/B3-1.png";
import b4 from "../../assets/aitrainer/B4.png";

export default function AiTrainerGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? <HeaderLogin /> : <HeaderDemo />}

      <main className="max-w-6xl px-4 py-10 mx-auto">
        {/* HERO */}
        <section className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
            AI Trainer – Phân tích tỉ lệ cơ thể & lộ trình cải thiện
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Trợ lý tập luyện AI
          </h1>
          <p className="mt-4 text-gray-700">
            Người dùng có thể tải ảnh cá nhân, AI sẽ phân tích tỉ lệ cơ thể
            (ngang – dọc – dài), đưa ra nhận định khách quan về kiểu hình, sau
            đó đề xuất một lộ trình tập luyện có cấu trúc để cải thiện các vùng
            ưu/nhược điểm.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-3">
            <div className="p-4 bg-white border rounded-xl border-rose-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Phân tích tỉ lệ
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Đo các mốc vai–hông (ngang), thân–chi (dọc), và tương quan chiều
                dài (dài) để suy ra kiểu hình.
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-rose-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Kết luận kiểu hình
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Tóm tắt điểm mạnh/yếu theo nhóm cơ & tỉ lệ; đưa khuyến nghị ưu
                tiên rõ ràng.
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-rose-200/70">
              <h3 className="text-sm font-semibold text-gray-900">
                Lộ trình tập
              </h3>
              <p className="mt-1 text-xs text-gray-600">
                Kế hoạch 4–8 tuần theo chu kỳ, bài tập mẫu, khối lượng & tần
                suất phù hợp.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={() =>
                isAuthenticated
                  ? navigate("/ai")
                  : navigate("/login", { state: { from: "/ai" } })
              }
              className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              {isAuthenticated ? "Mở AI Trainer" : "Đăng nhập để trải nghiệm"}
            </button>
          </div>
        </section>

        {/* QUY TRÌNH CHI TIẾT */}
        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-xl font-semibold text-gray-900">
            Quy trình phân tích & đề xuất
          </h2>
          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
            {/* B1: Tải ảnh */}
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 1 — Tải ảnh cá nhân
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  Ảnh
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Bạn cung cấp 1–3 ảnh toàn thân (đứng thẳng, ánh sáng đủ, nền tối
                giản). Hệ thống tự ẩn danh, chỉ trích xuất các mốc cơ thể để
                tính toán tỉ lệ.
              </p>
              {/* Khung ảnh */}
              <div className="mt-4 overflow-hidden bg-white border-2 border-dashed rounded-xl border-rose-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-80 bg-rose-50/40 sm:p-4">
                  <img
                    src={aiGuider}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* B2: Phân tích tỉ lệ */}
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 2 — Phân tích tỉ lệ (ngang • dọc • dài)
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  Phân tích
                </span>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium text-rose-700">Ngang:</span> so
                  sánh bề rộng vai–hông–đùi để xem cân xứng phần trên/dưới.
                </li>
                <li>
                  <span className="font-medium text-rose-700">Dọc:</span> tương
                  quan thân trên–thân dưới, độ trội của ngực/lưng/đùi.
                </li>
                <li>
                  <span className="font-medium text-rose-700">Dài:</span> tỉ lệ
                  chiều dài chân so với thân, chiều dài tay so với thân trên.
                </li>
              </ul>
              {/* Khung ảnh minh họa overlay */}
              <div className="mt-4 overflow-hidden bg-white border-2 border-dashed rounded-xl border-rose-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-80 bg-rose-50/40 sm:p-4">
                  <img
                    src={b2}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>

            {/* B3: Nhận định kiểu hình */}
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 3 — Nhận định tỉ lệ & kiểu hình
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  Kết luận
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Hệ thống phân loại sơ bộ: cân đối, phần trên trội, phần dưới
                trội, thân dài/chân dài, v.v. Kèm theo bản tóm tắt điểm mạnh/yếu
                theo nhóm cơ (vai, lưng, ngực, mông, đùi trước/sau, bắp tay/cẳng
                tay…).
              </p>
              {/* Khung ảnh mẫu báo cáo */}
              <div className="flex items-center justify-center w-full h-64 p-2 md:h-80 bg-rose-50/40 sm:p-4">
                <img
                  src={b3}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
                <img
                  src={b31}
                  alt="image-ai"
                  className="object-contain w-auto max-h-full"
                />
              </div>
            </div>

            {/* B4: Lộ trình tập luyện */}
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Bước 4 — Lộ trình tập luyện gợi ý
                </h3>
                <span className="px-2 py-0.5 text-xs rounded-full bg-rose-50 text-rose-700 ring-1 ring-rose-200">
                  Kế hoạch
                </span>
              </div>
              <ul className="mt-2 space-y-2 text-sm text-gray-700">
                <li>
                  <span className="font-medium text-rose-700">
                    Chu kỳ 4–8 tuần:
                  </span>{" "}
                  phân pha (làm quen → phát triển → củng cố), kiểm soát khối
                  lượng.
                </li>
                <li>
                  <span className="font-medium text-rose-700">
                    Ưu tiên nhóm cơ:
                  </span>{" "}
                  xác định 2–3 nhóm trọng điểm để cải thiện tỉ lệ.
                </li>
                <li>
                  <span className="font-medium text-rose-700">
                    Bài tập & set/reps:
                  </span>{" "}
                  gợi ý compound/isolation, biên độ, tempo, rest.
                </li>
                <li>
                  <span className="font-medium text-rose-700">Lịch tuần:</span>{" "}
                  số buổi/tuần, cấu trúc ngày kéo–đẩy–chân hoặc upper/lower.
                </li>
              </ul>
              {/* Khung ảnh card plan */}
              <div className="mt-4 overflow-hidden bg-white border-2 border-dashed rounded-xl border-rose-200">
                <div className="flex items-center justify-center w-full h-64 p-2 md:h-80 bg-rose-50/40 sm:p-4">
                  <img
                    src={b4}
                    alt="image-ai"
                    className="object-contain w-auto max-h-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THEO DÕI & CẬP NHẬT */}
        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-xl font-semibold text-gray-900">
            Theo dõi tiến độ & cập nhật gợi ý
          </h2>
          <div className="grid grid-cols-1 gap-6 mt-4 md:grid-cols-2">
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <h3 className="text-base font-semibold text-gray-900">
                Ghi nhận thực chiến
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Sau mỗi buổi, bạn ghi lại set/reps/tạ, mức mệt, và feedback. AI
                dùng dữ liệu này để điều chỉnh khối lượng tuần sau, đảm bảo tiến
                bộ mà không quá tải.
              </p>
              <div className="mt-4 overflow-hidden border-2 border-dashed rounded-xl border-rose-200">
                <div className="flex items-center justify-center w-full h-48 bg-rose-50/40 text-rose-600">
                  <span className="text-sm">
                    Khung ảnh 6: Biểu đồ tiến độ / PR
                  </span>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white border rounded-2xl border-rose-200/70">
              <h3 className="text-base font-semibold text-gray-900">
                Cập nhật kiểu hình (tùy chọn)
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Định kỳ (4–8 tuần), bạn có thể tải ảnh mới để AI đánh giá lại tỉ
                lệ, từ đó tinh chỉnh mục tiêu và ưu tiên nhóm cơ cho chu kỳ tiếp
                theo.
              </p>
              <div className="mt-4 overflow-hidden border-2 border-dashed rounded-xl border-rose-200">
                <div className="flex items-center justify-center w-full h-48 bg-rose-50/40 text-rose-600">
                  <span className="text-sm">
                    Khung ảnh 7: So sánh trước/sau
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BẢO MẬT & QUYỀN RIÊNG TƯ */}
        <section className="max-w-4xl p-5 mx-auto mt-16 border rounded-2xl border-rose-200/70 bg-rose-50/30">
          <h2 className="text-xl font-semibold text-gray-900">
            Bảo mật dữ liệu ảnh
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Ảnh được xử lý để trích xuất các mốc cơ thể, sau đó ẩn danh. Bạn có
            thể xóa ảnh bất cứ lúc nào. Chúng tôi chỉ dùng dữ liệu để cá nhân
            hóa lộ trình tập luyện; không chia sẻ cho bên thứ ba.
          </p>
        </section>

        {/* CTA CUỐI TRANG */}
        <section className="max-w-3xl mx-auto text-center mt-14">
          <button
            onClick={() =>
              isAuthenticated
                ? navigate("/ai")
                : navigate("/login", { state: { from: "/ai" } })
            }
            className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            {isAuthenticated
              ? "Bắt đầu phân tích ngay"
              : "Đăng nhập để bắt đầu"}
          </button>
          <p className="mt-3 text-xs text-gray-600">
            Mẹo: dùng ảnh nền đơn giản, đứng thẳng, tay thả tự nhiên để kết quả
            chính xác hơn.
          </p>
        </section>
      </main>
    </div>
  );
}
