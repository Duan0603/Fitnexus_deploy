import React, { useEffect } from 'react';
import { useAuth } from '../../context/auth.context.jsx';

export default function PaymentSuccess() {
  const { refreshUser } = useAuth();
  useEffect(() => {
    // Refresh user to reflect new premium status
    refreshUser().catch(() => {});
  }, []);
  return (
    <div className="max-w-2xl px-4 py-10 mx-auto text-center">
      <h1 className="mb-3 text-3xl font-bold text-green-600">Thanh toán thành công!</h1>
      <p className="text-gray-700">Tài khoản của bạn đã được nâng cấp. Cảm ơn bạn đã ủng hộ.</p>
    </div>
  );
}

