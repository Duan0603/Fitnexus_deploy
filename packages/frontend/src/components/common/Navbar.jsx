import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import logoDark from "../../assets/logodark.png";
import { ChevronDown } from "lucide-react";

// Nếu bạn đang dùng Theme/Auth context, có thể import như dưới.
// Không có thì bỏ 2 dòng này, và set isDark/user theo ý bạn.
import { useTheme } from "../../context/theme.context.jsx";
import { useAuth } from "../../context/auth.context.jsx";

export default function HeaderLogin() {
  const navigate = useNavigate();
  const { isDark } = useTheme?.() ?? { isDark: false };
  const { user, loading, logout, refreshUser } = useAuth?.() ?? {
    user: null, loading: false, logout: async () => {}, refreshUser: async () => {}
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [workoutOpen, setWorkoutOpen] = useState(false);
  const menuRef = useRef(null);
  const workoutRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (workoutRef.current && !workoutRef.current.contains(e.target)) setWorkoutOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!user && !loading) {
      refreshUser().catch(() => {});
    }
  }, [user, loading, refreshUser]);

  const isAdmin = !!(user && String(user.role || "").toUpperCase() === "ADMIN");
  const isPremium =
    !!(user && ((user.user_type && String(user.user_type).toLowerCase() === "premium") || user.plan === "PREMIUM"));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="shrink-0 -m-1.5 p-1.5"
          data-nav="home"
        >
          <img src={isDark ? logoDark : logo} alt="Fitnexus" className="h-10" />
        </button>

        {/* Nav desktop */}
        <nav className="items-center hidden gap-6 md:flex">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-base text-gray-800 hover:underline"
            data-nav="home"
          >
            Trang chủ
          </button>

          {/* Luyện tập (dropdown) */}
          <div className="relative" ref={workoutRef}>
            <button
              type="button"
              onClick={() => setWorkoutOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-base text-gray-800 hover:underline"
              data-nav="workout"
              aria-expanded={workoutOpen}
            >
              Luyện tập <ChevronDown size={16} />
            </button>

            {workoutOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-md bg-white shadow-lg ring-1 ring-black/5 p-2 z-50">
                <button
                  type="button"
                  onClick={() => { setWorkoutOpen(false); navigate("/exercises"); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                  data-nav="workout-all"
                >
                  <div className="font-semibold">Xem tất cả bài tập</div>
                  <div className="text-xs text-gray-500">1000+ bài tập theo nhóm cơ</div>
                </button>
                <button
                  type="button"
                  onClick={() => { setWorkoutOpen(false); navigate("/plans"); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                  data-nav="workout-my-plans"
                >
                  Kế hoạch của tôi
                </button>
                <button
                  type="button"
                  onClick={() => { setWorkoutOpen(false); navigate("/plans/new"); }}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-50"
                  data-nav="workout-create"
                >
                  Tạo plan mới
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/modeling-preview")}
            className="text-base text-gray-800 hover:underline"
            data-nav="modeling"
          >
            Mô hình hoá
          </button>

          <button
            type="button"
            onClick={() => navigate("/nutrition-ai")}
            className="text-base text-gray-800 hover:underline"
            data-nav="nutrition"
          >
            Dinh dưỡng
          </button>

          {!isAdmin && !isPremium && (
            <button
              type="button"
              onClick={() => navigate("/pricing")}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700"
              data-nav="pricing"
            >
              Nâng cấp Premium
            </button>
          )}
        </nav>

        {/* User area */}
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" aria-label="Đang tải" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-center w-10 h-10 text-sm font-medium text-white rounded-full bg-gradient-to-r from-blue-400 to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 w-48 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                  <div className="px-3 py-2 text-sm text-gray-700">
                    <div className="font-semibold truncate">{user.fullName || user.username || "Người dùng"}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email || ""}</div>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <button
                    onClick={async () => { setMenuOpen(false); await logout(); navigate("/login"); }}
                    className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-gray-700 hover:underline"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
