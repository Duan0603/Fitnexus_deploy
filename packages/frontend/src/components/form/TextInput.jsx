import React from 'react';

export default function TextInput({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  required = false, 
  showValidationIcon = false, 
  isValid = false,
  error = null,
  loading = false
}) {
  const hasError = !!error;
  const showSuccessIcon = showValidationIcon && isValid && value && !hasError && !loading;
  const showLoadingIcon = loading && value;

  return (
    <div className="block text-sm">
      {label && <span className="block mb-1 font-medium text-gray-700">{label}</span>}
      <div className="relative">
        <input
          className={`w-full px-3 py-2 transition-colors bg-white border rounded outline-none ${
            hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          } ${
            (showValidationIcon && (showSuccessIcon || showLoadingIcon)) ? 'pr-10' : ''
          }`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="on"
        />
        {showSuccessIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center justify-center w-10">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {showLoadingIcon && (
          <div className="absolute inset-y-0 right-0 flex items-center justify-center w-10">
            <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

