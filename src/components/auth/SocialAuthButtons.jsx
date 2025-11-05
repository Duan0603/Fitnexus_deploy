import React from 'react';

function ProviderButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center w-10 h-10 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

export default function SocialAuthButtons({ onFacebook, onGoogle, onApple }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <ProviderButton onClick={onGoogle}>
        <span className="text-[18px]">G</span>
      </ProviderButton>
      <ProviderButton onClick={onApple}>
        <span className="text-[18px]"></span>
      </ProviderButton>
    </div>
  );
}

