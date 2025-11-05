import React from 'react';
import usePasswordVisibility from '../../hooks/usePasswordVisibility.js';
import PasswordStrengthIndicator from './PasswordStrengthIndicator.jsx';

export default function PasswordInput({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  showStrengthIndicator = false,
  isValid = false,
  error = null
}) {
  const { type, visible, toggle } = usePasswordVisibility(false);
  const hasError = !!error;
  const showSuccessIcon = isValid && value && !hasError;

  return (
    <div className="block text-sm">
      {label && <span className="block mb-1 font-medium text-gray-700">{label}</span>}
      <div className="relative">
        <input
          className={`w-full px-3 py-2 transition-colors bg-white border rounded outline-none ${
            hasError 
              ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
              : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
          } ${showSuccessIcon ? 'pr-20' : 'pr-10'}`}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete="new-password"
        />
        {showSuccessIcon && (
          <div className="absolute inset-y-0 right-10 flex items-center justify-center w-10">
            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {/* Eye icon */}
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l3.08 3.08A11.74 11.74 0 0 0 1.5 12S4.5 19.5 12 19.5c2.01 0 3.78-.47 5.28-1.23l3.19 3.19a.75.75 0 0 0 1.06-1.06l-18-18Z"/>
              <path d="M8.47 7.41l1.77 1.77a3 3 0 0 0 4.58 3.58l1.77 1.77A5.25 5.25 0 0 1 12 17.25C7.754 17.25 5.088 14.6 3.8 12c.474-.91 1.16-1.88 2.08-2.76.76-.71 1.6-1.31 2.59-1.83Z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 5.25C7.754 5.25 5.088 7.9 3.8 10.5c1.288 2.6 3.954 5.25 8.2 5.25s6.912-2.65 8.2-5.25C18.912 7.9 16.246 5.25 12 5.25ZM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z"/>
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {showStrengthIndicator && value && <PasswordStrengthIndicator password={value} />}
    </div>
  );
}

