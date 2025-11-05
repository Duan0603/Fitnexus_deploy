import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";

export default function ExercisesDemo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <div className="min-h-screen bg-white">
      {isAuthenticated ? <HeaderLogin /> : <HeaderDemo />}

      <main className="max-w-6xl px-4 py-10 mx-auto">
        {/* HERO */}
        <section className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            Thư viện bài tập – 1000+ bài, lọc đa chiều
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Thư viện bài tập Fitnexus
          </h1>
          <p className="mt-4 text-gray-700">
            Khám phá hệ thống bài tập được chuẩn hóa theo nhóm cơ, độ khó, dụng
            cụ và mục tiêu. Xem hướng dẫn chi tiết, ảnh/GIF minh họa và gợi ý
            lập kế hoạch luyện tập hiệu quả.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-3">
            <div className="p-4 bg-white border rounded-xl border-blue-200/70">
              <h3 className="text-sm font-semibold text-gray-900">Lọc đa chiều</h3>
              <p className="mt-1 text-xs text-gray-600">
                Theo nhóm cơ, độ khó, dụng cụ, kiểu bài (cardio/strength...).
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-blue-200/70">
              <h3 className="text-sm font-semibold text-gray-900">Hướng dẫn rõ ràng</h3>
              <p className="mt-1 text-xs text-gray-600">
                Mô tả động tác, điểm cần lưu ý, ảnh/GIF minh họa.
              </p>
            </div>
            <div className="p-4 bg-white border rounded-xl border-blue-200/70">
              <h3 className="text-sm font-semibold text-gray-900">Gắn với kế hoạch</h3>
              <p className="mt-1 text-xs text-gray-600">
                Thêm vào kế hoạch luyện tập cá nhân và buổi hôm nay.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <button
              onClick={() =>
                isAuthenticated
                  ? navigate("/exercises")
                  : navigate("/login", { state: { from: "/exercises" } })
              }
              className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {isAuthenticated ? "Mở thư viện bài tập" : "Đăng nhập để xem toàn bộ"}
            </button>
          </div>
        </section>

        {/* HƯỚNG DẪN SỬ DỤNG */}
        <section className="max-w-5xl mx-auto mt-16">
          <h2 className="text-xl font-semibold text-gray-900">Cách sử dụng</h2>
          <div className="grid grid-cols-1 gap-6 mt-6 md:grid-cols-2">
            <div className="p-5 bg-white border rounded-2xl border-blue-200/70">
              <h3 className="text-base font-semibold text-gray-900">Bước 1 — Chọn nhóm cơ/mục tiêu</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Lọc theo nhóm cơ muốn phát triển hoặc mục tiêu (giảm mỡ, tăng cơ,
                cardio...). Sử dụng tìm kiếm nhanh theo tên bài tập.
              </p>
            </div>
            <div className="p-5 bg-white border rounded-2xl border-blue-200/70">
              <h3 className="text-base font-semibold text-gray-900">Bước 2 — Xem hướng dẫn chi tiết</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Mỗi bài có phần mô tả chuẩn, điểm chú ý và media minh họa. Xem chi
                tiết để nắm kỹ thuật chuẩn trước khi tập.
              </p>
            </div>
            <div className="p-5 bg-white border rounded-2xl border-blue-200/70">
              <h3 className="text-base font-semibold text-gray-900">Bước 3 — Thêm vào kế hoạch</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Khi đã đăng nhập, bạn có thể thêm bài vào kế hoạch sẵn có hoặc tạo
                kế hoạch mới phù hợp mục tiêu cá nhân.
              </p>
            </div>
            <div className="p-5 bg-white border rounded-2xl border-blue-200/70">
              <h3 className="text-base font-semibold text-gray-900">Bước 4 — Theo dõi tiến độ</h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                Ghi nhận các buổi tập và khối lượng để theo dõi tiến bộ theo thời
                gian và nhận gợi ý tối ưu.
              </p>
            </div>
          </div>
        </section>

        {/* BẢO MẬT & NGUỒN DỮ LIỆU */}
        <section className="max-w-4xl p-5 mx-auto mt-16 border rounded-2xl border-blue-200/70 bg-blue-50/30">
          <h2 className="text-xl font-semibold text-gray-900">Nguồn dữ liệu & tính nhất quán</h2>
          <p className="mt-2 text-sm leading-6 text-gray-700">
            Thư viện được chuẩn hóa từ nhiều nguồn uy tín, có quy trình rà soát và
            cập nhật định kỳ để đảm bảo tính chính xác. Media minh họa được kiểm
            duyệt nhằm đảm bảo dễ hiểu và thực hành an toàn.
          </p>
        </section>

        {/* CTA CUỐI TRANG */}
        <section className="max-w-3xl mx-auto text-center mt-14">
          <button
            onClick={() =>
              isAuthenticated
                ? navigate("/exercises")
                : navigate("/login", { state: { from: "/exercises" } })
            }
            className="px-6 py-3 text-sm font-semibold text-white rounded-full bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {isAuthenticated ? "Xem toàn bộ bài tập" : "Đăng nhập để xem toàn bộ"}
          </button>
          <p className="mt-3 text-xs text-gray-600">
            Sau khi đăng nhập, bạn có thể truy cập thư viện đầy đủ và thêm bài tập
            vào kế hoạch cá nhân.
          </p>
        </section>
      </main>
    </div>
  );
}
