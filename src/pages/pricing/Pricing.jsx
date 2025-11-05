import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/auth.context.jsx';
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import {
  getActiveSubscriptionPlans,
  createPaymentLinkApi,
} from "../../lib/api.js";

export default function Pricing() {
  const { user, loading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // Luôn redirect tới PayOS, không hiện QR trong app

  useEffect(() => {
    (async () => {
      try {
        const res = await getActiveSubscriptionPlans();
        setPlans(res?.data || []);
      } catch (e) {
        setError(e?.response?.data || { message: e.message });
      }
    })();
  }, []);

  const handlePurchase = async (planId) => {
    try {
      setBusy(true);
      const res = await createPaymentLinkApi(planId);
      const payload = res; // res is already res.data
      const url = payload?.data?.checkoutUrl;
      if (!url) throw new Error("Không nhận được checkoutUrl từ PayOS");
      window.location.href = url;
    } catch (e) {
      setError(e?.response?.data || { message: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800 bg-white">
      {/* HEADER (giống Dashboard/Landing) */}
      <HeaderLogin />

      {/* HERO: màu & chữ giống Landing/Dashboard */}
      <section className="relative px-8 md:px-20 py-20 bg-gradient-to-r from-[#0b1023] via-[#101735] to-[#162142] text-white rounded-b-[3rem]">
        <div className="max-w-6xl mx-auto space-y-4 text-center">
          <h1 className="text-5xl font-extrabold leading-tight md:text-6xl">
            Chọn gói <span className="text-blue-400">Fitnexus</span> phù hợp
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-300">
            Nâng cấp trải nghiệm luyện tập với AI, bài tập chất lượng cao và
            theo dõi tiến độ chi tiết.
          </p>
        </div>
      </section>

      {/* PRICING GRID */}
      <section className="px-8 py-16 bg-white md:px-20">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="p-4 mb-6 text-sm text-red-800 bg-red-100 border border-red-200 rounded">
              {error.message || "Đã xảy ra lỗi"}
            </div>
          ) : null}

          <div className="space-y-4">
            {plans.map((p) => (
              <div
                key={p.plan_id}
                className="flex flex-col gap-4 p-6 transition bg-white border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg md:flex-row md:items-center md:justify-between"
              >
                {/* Left: Thông tin chi tiết gói */}
                <div className="md:pr-6">
                  <h3 className="text-2xl font-thin text-gray-900">{p.name}</h3>
                  <div className="mt-1 text-sm text-gray-500">
                    {p.duration_days} ngày
                  </div>
                  {p?.description ? (
                    <p className="mt-3 text-gray-600">{p.description}</p>
                  ) : null}
                  <div className="mt-4 text-3xl font-bold text-gray-900">
                    {(p.price || 0).toLocaleString()}{" "}
                    <span className="text-lg align-top">VND</span>
                  </div>
                </div>

                {/* Right: CTA mua ngay */}
                <div className="shrink-0 md:text-right">
                  <button
                    className="w-full px-6 py-3 font-semibold text-white transition bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 md:w-auto"
                    disabled={busy || !user}
                    onClick={() => handlePurchase(p.plan_id)}
                    aria-busy={busy}
                  >
                    {user
                      ? busy
                        ? "Đang xử lý..."
                        : "Mua ngay"
                      : "Đăng nhập để mua"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Không dùng modal QR – luôn redirect tới PayOS */}
        </div>
      </section>
    </div>
  );
}
