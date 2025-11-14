import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth.context.jsx';
import { verifyPaymentStatusApi } from '../../lib/api.js';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [message, setMessage] = useState('Đang xác nhận thanh toán...');
  const [countdown, setCountdown] = useState(0);

  const orderCode = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search || '');
      const oc = params.get('orderCode');
      return oc ? String(oc) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const verify = async () => {
      if (!orderCode) {
        setMessage('Thanh toán thành công!');
        await refreshUser().catch(() => {});
        setCountdown(3);
        return;
      }
      try {
        const maxAttempts = 6;
        let delay = 500; // ms
        for (let i = 0; i < maxAttempts; i++) {
          const res = await verifyPaymentStatusApi(orderCode);
          const payStatus = String(res?.status || '').toUpperCase();
          const dbStatus = String(res?.transaction?.dbStatus || '').toLowerCase();
          if (payStatus === 'PAID' || dbStatus === 'completed') {
            if (!mounted) return;
            setMessage('Thanh toán thành công!');
            await refreshUser().catch(() => {});
            setCountdown(3);
            return;
          }
          if (['CANCELLED', 'FAILED', 'EXPIRED'].includes(payStatus)) {
            if (!mounted) return;
            setMessage('Giao dịch không thành công. Vui lòng thử lại.');
            return;
          }
          await new Promise((r) => setTimeout(r, delay));
          delay = Math.min(delay * 2, 3000);
        }
        setMessage('Thanh toán thành công! (đang cập nhật tài khoản)');
        await refreshUser().catch(() => {});
        setCountdown(3);
      } catch (e) {
        setMessage('Thanh toán thành công! (đang cập nhật tài khoản)');
        await refreshUser().catch(() => {});
        setCountdown(3);
      }
    };

    verify();
    return () => {
      mounted = false;
    };
  }, [orderCode, refreshUser]);

  useEffect(() => {
    if (countdown <= 0) return;
    const tick = setInterval(() => setCountdown((s) => s - 1), 1000);
    if (countdown === 1) {
      const to = setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
      return () => {
        clearInterval(tick);
        clearTimeout(to);
      };
    }
    return () => clearInterval(tick);
  }, [countdown, navigate]);

  return (
    <div className="max-w-2xl px-4 py-10 mx-auto text-center">
      <h1 className="mb-3 text-3xl font-bold text-green-600">Thanh toán thành công!</h1>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex items-center justify-center">
        <button
          className="px-5 py-2 text-green-700 bg-green-50 rounded border border-green-200 hover:bg-green-100"
          onClick={() => navigate('/dashboard', { replace: true })}
        >
          Về trang chủ
        </button>
      </div>
      {countdown > 0 && (
        <p className="mt-4 text-sm text-gray-500">Tự chuyển về Dashboard sau {countdown}s…</p>
      )}
    </div>
  );
}

