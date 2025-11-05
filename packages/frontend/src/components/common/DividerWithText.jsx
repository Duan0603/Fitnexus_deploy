import React from 'react';

export default function DividerWithText({ children }) {
  return (
    <div className="flex items-center my-6">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="px-3 text-xs font-medium text-gray-400 select-none">{children}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

