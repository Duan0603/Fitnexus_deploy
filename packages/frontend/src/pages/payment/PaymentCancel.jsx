import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard immediately on cancel
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="max-w-2xl px-4 py-10 mx-auto text-center">
      <h1 className="mb-3 text-3xl font-bold text-red-600">Đang chuyển về Dashboard…</h1>
    </div>
  );
}

