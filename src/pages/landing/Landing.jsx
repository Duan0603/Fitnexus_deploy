import React, { useState, useRef, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";


import absIcon from "../../assets/body/coreIcon.svg";
import backIcon from "../../assets/body/backIcon.svg";
import bicepsIcon from "../../assets/body/bicepsIcon.svg";
import cardioIcon from "../../assets/body/cardioIcon.svg";
import chestIcon from "../../assets/body/chestIcon.svg";
import forearmsIcon from "../../assets/body/forearmsIcon.svg";
import glutesIcon from "../../assets/body/glutesIcon.svg";
import shouldersIcon from "../../assets/body/shouldersIcon.svg";
import tricepsIcon from "../../assets/body/tricepsIcon.svg";
import upperLegsIcon from "../../assets/body/upperLegsIcon.svg";
import lowerLegsIcon from "../../assets/body/lowerLegsIcon.svg";
import { Target, Star, ChevronRight, Play } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import { HumanModel } from "../../components/3d/HumanModel.jsx";
import { Bounds, OrbitControls } from "@react-three/drei";
import HeaderDemo from "../../components/header/HeaderDemo.jsx";
import api from "../../lib/api.js";

const Fitnexus3DLanding = () => {
  const navigate = useNavigate();
  const [controlsActive, setControlsActive] = useState(false);
  const canvasWrapRef = useRef(null);


  const handleStartOnboarding = async () => {
    if (!isAuthenticated()) {
      navigate("/login", { state: { from: "/onboarding/age" } });
      return;
    }

    try {
      const response = await api.get("/api/onboarding/session", {
        params: { t: Date.now() },
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        withCredentials: true,
      });

      const data = response?.data?.data || {};
      if (response?.status === 200 && response?.data?.success) {
        console.log("[Landing] /api/onboarding/session OK", {
          required: data.required,
          completed: data.completed,
          sessionId: data.sessionId || null,
          nextStepKey: data.nextStepKey || data.currentStepKey || null,
        });
      } else {
        console.warn("[Landing] /api/onboarding/session unexpected response", response?.status, response?.data);
      }
      if (data.required && !data.completed) {
        const nextStep = String(
          data.nextStepKey || data.currentStepKey || "age"
        ).toLowerCase();
        navigate(`/onboarding/${nextStep}`);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("[Landing] Error calling /api/onboarding/session", {
        message: error?.message,
        status: error?.response?.status,
        body: error?.response?.data,
      });
      navigate("/onboarding/age");
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key == "Escape") setControlsActive(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const muscleGroups = [
    { id: "abs", label: "Abs", icon: absIcon },
    { id: "back", label: "Back", icon: backIcon },
    { id: "biceps", label: "Biceps", icon: bicepsIcon },
    { id: "cardio", label: "Cardio", icon: cardioIcon },
    { id: "chest", label: "Chest", icon: chestIcon },
    { id: "forearms", label: "Forearms", icon: forearmsIcon },
    { id: "glutes", label: "Glutes", icon: glutesIcon },
    { id: "shoulders", label: "Shoulders", icon: shouldersIcon },
    { id: "triceps", label: "Triceps", icon: tricepsIcon },
    { id: "upper-legs", label: "Upper Legs", icon: upperLegsIcon },
    { id: "lower-legs", label: "Lower Legs", icon: lowerLegsIcon },
  ];

  const [selectedGroups, setSelectedGroups] = useState([
    "shoulders",
    "triceps",
  ]);
  const toggleGroup = (id) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const features = [
    "Kế hoạch luyện tập cá nhân hóa",
    "Hơn 1000+ bài tập chất lượng cao",
    "Theo dõi tiến độ chi tiết",
    "Mô hình 3D cho phép chọn chi tiết nhóm cơ cần phát triển",
  ];

  return (
    <div className="min-h-screen text-black bg-white">
      <HeaderDemo/>

      <section className="relative flex items-center min-h-screen px-6 pt-32 pb-20 overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="object-cover w-full h-full"
          >
            <source src="/vidbgr.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-gray/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-6xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-8 text-6xl font-normal leading-tight md:text-7xl lg:text-6xl">
              <span className="text-transparent bg-gradient-to-r from-white to-gray-400 bg-clip-text">
                Luyện tập thông minh.
                <br />
                Duy trì đều đặn.
                <br />
                Thành công rực rỡ.
              </span>
            </h1>
            <p className="max-w-3xl mx-auto mb-12 text-xl text-gray-300 md:text-2xl">
              Fitnexus kết hợp sức mạnh của AI và chuyên môn của các nhà khoa
              học thể thao để tạo ra kế hoạch luyện tập tốt nhất cho bạn.
            </p>
            <button
              onClick={handleStartOnboarding}
              className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold text-black transition bg-white rounded-full hover:bg-gray-200 group"
            >
              Nhận kế hoạch luyện tập cá nhân hóa
              <ChevronRight
                className="transition-transform group-hover:translate-x-1"
                size={24}
              />
            </button>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="px-6 py-3 text-sm font-medium border rounded-full bg-white/10 backdrop-blur-sm border-white/20"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Laptop Mockup Section */}
      <section className="relative px-6 py-32 bg-gradient-to-b from-white to-gray-200">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-5xl font-bold md:text-6xl from-black to-gray-400">
              Trải nghiệm luyện tập
              <br />
              <span className="text-transparent bg-gradient-to-r from-black to-gray-400 bg-clip-text">
                tương tác 3D
              </span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-gray-400">
              Khám phá từng nhóm cơ với mô hình 3D chi tiết và nhận hướng dẫn
              bài tập phù hợp
            </p>
          </div>

          {/* Laptop Mockup */}
          <div className="relative max-w-6xl mx-auto">
            {/* Laptop Frame */}
            <div className="relative">
              {/* Screen */}
              <div className="p-4 bg-gray-400 border-4 border-gray-500 rounded-t-xl">
                <div className="overflow-hidden bg-black rounded-lg aspect-video">
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-200 to-gray300">
                    <div
                      ref={canvasWrapRef}
                      tabIndex={0} // để nhận blur khi click ra ngoài
                      onPointerDown={() => setControlsActive(true)} // click để bật điều khiển
                      onPointerUp={() => {
                        /* không tắt ngay để người dùng kéo/zoom */
                      }}
                      onPointerLeave={() => setControlsActive(false)} // rời khung là tắt
                      onBlur={() => setControlsActive(false)} // mất focus là tắt
                      // Mobile: khi chưa active, cho phép cuộn dọc; khi active, chặn gesture để xoay/zoom mượt
                      style={{ touchAction: controlsActive ? "none" : "pan-y" }}
                      className="w-full h-full"
                    >
                      <Canvas
                        camera={{
                          position: [0, 1.6, 5],
                          fov: 50,
                          near: 0.01,
                          far: 10000,
                        }}
                      >
                        <ambientLight intensity={0.7} />
                        <directionalLight
                          position={[10, 12, 8]}
                          intensity={1}
                        />
                        <directionalLight
                          position={[-10, -5, -5]}
                          intensity={0.3}
                        />
                        <Suspense fallback={null}>
                          <Bounds fit observe margin={1.2}>
                            <HumanModel />
                          </Bounds>
                        </Suspense>

                        {/* CHỈ bật điều khiển khi người dùng đã click vào khung */}
                        <OrbitControls
                          makeDefault
                          target={[0, 1, 0]}
                          // Không cho pan; tùy ý bật nếu bạn muốn
                          enablePan={false}
                          // Gate toàn bộ điều khiển theo state
                          enabled={controlsActive}
                          enableZoom={controlsActive}
                          enableRotate={controlsActive}
                          minDistance={1}
                          maxDistance={10}
                          zoomSpeed={0.9}
                        />
                      </Canvas>
                    </div>
                  </div>
                </div>
              </div>
              {/* Laptop Base */}
              <div className="h-6 bg-gradient-to-b from-gray-700 to-gray-800 rounded-b-2xl"></div>

              <div className="w-3/4 h-2 mx-auto bg-gray-900 rounded-b-3xl"></div>
              {!controlsActive && (
                <div className="absolute px-3 py-1 text-xs text-white rounded-full right-4 top-4 bg-black/60">
                  Nhấn vào mô hình để xoay/zoom
                </div>
              )}
            </div>

            {/* Floating Feature Cards */}
            <div className="absolute hidden -left-8 top-1/4 lg:block">
              <div className="max-w-xs p-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-full">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Click & Khám phá</h3>
                    <p className="text-sm text-gray-400">
                      Chọn nhóm cơ để xem bài tập chi tiết
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute hidden -right-8 top-2/3 lg:block">
              <div className="max-w-xs p-6 border bg-white/10 backdrop-blur-md border-white/20 rounded-2xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Play size={24} />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold">Video 3D</h3>
                    <p className="text-sm text-gray-400">
                      Hướng dẫn chi tiết từng động tác
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Below Laptop */}
          <div className="mt-16 text-center">
            <button
              className="inline-flex items-center gap-3 px-10 py-5 text-lg font-semibold transition rounded-full bg-gradient-to-r from-gray-500 to-black-200 hover:scale-105"
              onClick={() => navigate("/modeling-demo")}
            >
              Khám phá ngay
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* How It Works - Grid Style */}

      {/* Muscle Groups Library */}
      <section id="library" className="px-6 py-24 bg-gray-100">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10">
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              Thư viện bài tập
            </h2>
            <p className="text-gray-500">
              200+ bài tập được phân loại theo nhóm cơ và mục tiêu
            </p>
          </div>

          {/* Horizontal icon list like the mockup */}
          <div className="-mx-2 overflow-x-auto">
            <div className="flex items-start gap-4 px-2">
              {muscleGroups.map((g) => {
                const selected = selectedGroups.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className={`shrink-0 rounded-2xl p-2 transition border ${
                      selected
                        ? "border-blue-500"
                        : "border-transparent hover:border-blue-300"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="w-[92px] h-[92px] rounded-xl bg-gray-200 flex items-center justify-center">
                      <img
                        src={g.icon}
                        alt={g.label}
                        className="w-[82px] h-[82px] object-contain"
                      />
                    </div>
                    <div
                      className={`mt-2 text-center text-sm font-semibold ${
                        selected ? "text-blue-600" : "text-blue-600"
                      }`}
                    >
                      {g.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={() => navigate("/exercises-demo")}>
            Xem thêm nhiều bài tập
          </button>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-32 bg-gray-300">
        <div className="mx-auto text-center max-w-7xl">
          <h2 className="mb-6 text-5xl font-bold md:text-6xl">
            PHÂN TÍCH THỰC PHẨM THÔNG MINH
          </h2>
          <p className="mb-20 text-xl text-gray-400">
            Đưa ra những kết quả chính xác về dinh dưỡng của thực phẩm bạn muốn,
            lượng calories, lượng dinh dưỡng
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                name: "Minh Tuấn",
                result: "Giảm 12kg trong 3 tháng",
                quote:
                  "App đã thay đổi hoàn toàn thói quen tập luyện của tôi. Kế hoạch chi tiết và dễ theo dõi!",
              },
              {
                name: "Thu Hà",
                result: "Tăng 5kg cơ bắp",
                quote:
                  "Mô hình 3D giúp tôi hiểu rõ từng động tác. Không còn lo sai tư thế nữa.",
              },
              {
                name: "Đức Anh",
                result: "Chạy được 10km liên tục",
                quote:
                  "Từ người không thể chạy 1km đến chạy được 10km. Cảm ơn Fitnexus!",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 transition border-2 border-gray-700 bg-gray-800/50 rounded-3xl hover:border-blue-500"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      size={24}
                      className="text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <p className="mb-6 text-lg italic text-gray-300">
                  "{item.quote}"
                </p>
                <div className="pt-6 border-t border-gray-700">
                  <div className="mb-1 text-xl font-bold">{item.name}</div>
                  <div className="font-medium text-blue-400">{item.result}</div>
                </div>
              </div>
            ))}
          </div>
          {/* CTA: chuyển sang Nutrition AI */}
          <div className="mt-12">
            <button
              type="button"
              onClick={() => navigate("/nutrition-ai")}
              className="inline-flex items-center gap-2 px-6 py-3 font-semibold text-white transition rounded-full bg-gradient-to-r from-gray-500 to-black-600 hover:opacity-90"
            >
              Khám phá Nutrition AI
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-32 bg-gradient-to-b from-gray-200 to-gray-400">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="mb-8 text-6xl font-bold leading-tight md:text-7xl">
            Sẵn sàng bắt đầu
            <br />
            <span className="text-transparent bg-gradient-to-r from-black to-gray-400 bg-clip-text">
              hành trình của bạn?
            </span>
          </h2>
          <p className="mb-12 text-2xl text-gray-400">
            Tham gia cùng hàng nghìn người đang thay đổi cuộc sống
          </p>
          <button className="inline-flex items-center gap-3 px-12 py-6 text-xl font-semibold text-black transition bg-white rounded-full hover:bg-gray-200">
            Nhận kế hoạch miễn phí
            <ChevronRight size={28} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-16 bg-gray-500 border-t">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 mb-12 md:grid-cols-4">
            <div>
              <div className="text-base/6 text-zinc-950 dark:text-white hover:underline -m-1.5 p-1.5 shrink-0">
                <img src={logo} alt="Fitnexus logo" className="h-48" />
              </div>
              <p className="text-gray-400">
                Nền tảng luyện tập thông minh với AI
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Sản phẩm</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Tính năng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Giá cả
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Thư viện
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Công ty</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Liên hệ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold">Hỗ trợ</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white">
                    Trợ giúp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 text-center text-gray-400 border-t border-gray-800">
            <p>© 2025 Fitnexus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Fitnexus3DLanding;
