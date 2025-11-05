import React from "react";
import { useTheme } from "../../context/theme.context.jsx";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggle } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={toggle}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 ${className}`}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
          <path fillRule="evenodd" d="M12 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V2.25A.75.75 0 0112 1.5zm0 18a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zM4.47 4.47a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L4.47 5.53a.75.75 0 010-1.06zm12.94 12.94a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM1.5 12a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5H2.25A.75.75 0 011.5 12zm18 0a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zM4.47 19.53a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06L5.53 19.53a.75.75 0 01-1.06 0zm12.94-12.94a.75.75 0 010-1.06l1.06-1.06a.75.75 0 111.06 1.06L17.41 6.59a.75.75 0 01-1.06 0z" clipRule="evenodd" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M21.752 15.002A9.718 9.718 0 0112 21.75a9.75 9.75 0 01-9.75-9.75 9.718 9.718 0 016.748-9.252.75.75 0 01.917.966A8.251 8.251 0 0012 20.25a8.251 8.251 0 008.286-2.085.75.75 0 011.466.837z"/>
        </svg>
      )}
    </button>
  );
}

