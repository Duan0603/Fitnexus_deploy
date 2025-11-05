import React from 'react';

export default function Alert({ type = 'info', children }) {
  const color =
    type === 'error' ? 'text-red-700 bg-red-50 border-red-200' :
    type === 'success' ? 'text-green-700 bg-green-50 border-green-200' :
    'text-sky-700 bg-sky-50 border-sky-200';

  return (
    <div className={`w-full px-3 py-2 text-sm border rounded ${color}`}>{children}</div>
  );
}

