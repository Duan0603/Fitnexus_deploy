// layouts/AuthLayout.jsx
import React from 'react';
import logo from '../assets/branch/logo.png';

export default function AuthLayout({ children, ratio = '1/2' }) {
  const ratios = {
    '1/2': { left: 'lg:w-1/2', right: 'lg:w-1/2' },
    '1/3': { left: 'lg:w-1/3', right: 'lg:w-2/3' },
    '1/4': { left: 'lg:w-1/4', right: 'lg:w-3/4' },
  };
  const leftW = (ratios[ratio] || ratios['1/2']).left;
  const rightW = (ratios[ratio] || ratios['1/2']).right;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Side - Logo & Branding */}
      <div className={`relative hidden overflow-hidden lg:flex ${leftW} lg:shrink-0 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-400 to-indigo-300`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-32 h-32 bg-white rounded-full top-10 left-10 blur-xl"></div>
          <div className="absolute w-48 h-48 bg-white rounded-full bottom-20 right-20 blur-2xl"></div>
          <div className="absolute w-24 h-24 bg-white rounded-full top-1/2 left-1/3 blur-lg"></div>
        </div>
        
        {/* Logo & Content */}
        <div className="relative z-10 text-center text-white">
          <div className="mb-8">
            {/* Logo Icon */}
            <div className="flex justify-center mb-4">
              <div>
                <img src={logo} alt="FITNEXUS" className="object-contain w-36 h-36 rounded-xl" />
              </div>
              </div>
            <h1 className="mb-2 text-4xl font-bold">FITNEXUS</h1>
            <p className="max-w-md mx-auto text-lg leading-relaxed text-blue-100">
              Transform your fitness journey with personalized workouts and expert guidance
            </p>
          </div>
          
          {/* Features List */}
          <div className="max-w-sm mx-auto space-y-4">
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Personalized workout plans
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Progress tracking & analytics
            </div>
            <div className="flex items-center text-blue-100">
              <svg className="w-5 h-5 mr-3 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Expert fitness guidance
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className={`flex flex-col justify-center ${rightW} px-4 py-12 sm:px-6 lg:px-8 xl:px-12`}>
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo - Only show on small screens */}
          <div className="mb-8 text-center lg:hidden">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-xl">
                <img src={logo} alt="FITNEXUS" className="object-contain w-10 h-10" />
              </div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">FITNEXUS</h1>
          </div>

          {/* Form Content */}
          <div className="px-6 py-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
            {children}
          </div>
          
          {/* Footer */}
          <div className="mt-6 text-sm text-center text-gray-500">
            <p>&copy; 2025 Fitnexus. All rights reserved.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="transition-colors hover:text-blue-600">Privacy Policy</a>
              <span>&middot;</span>
              <a href="#" className="transition-colors hover:text-blue-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
