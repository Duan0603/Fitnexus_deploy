import React from 'react';

export default function Checkbox({ label, name, checked, onChange, required = false }) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        className="mt-1 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
      />
      <span className="leading-6 text-gray-600">{label}</span>
    </label>
  );
}

