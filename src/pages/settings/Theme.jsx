import React from "react";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { useTheme } from "../../context/theme.context.jsx";

export default function Theme() {
  const { theme, setTheme, isDark } = useTheme();

  const status = theme === "dark" ? "Bật" : theme === "light" ? "Tắt" : isDark ? "Bật" : "Tắt";

  return (
    <div className="min-h-screen app-surface">
      <HeaderLogin />
      <div className="max-w-4xl px-4 py-8 mx-auto">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/80 px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-gray-900 dark:text-gray-100">Chế độ tối</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{status}</div>
          </div>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
          >
            <option value="dark">Bật</option>
            <option value="light">Tắt</option>
            <option value="system">Theo hệ thống</option>
          </select>
        </div>
      </div>
    </div>
  );
}

