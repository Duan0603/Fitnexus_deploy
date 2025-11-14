import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/auth.context.jsx';
import HeaderLogin from '../../components/header/HeaderLogin.jsx';
import HeaderDemo from '../../components/header/HeaderDemo.jsx';
import { getActiveSubscriptionPlans, createPaymentLinkApi, listMyPurchasesApi } from '../../lib/api.js';
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Dumbbell,
  Layers,
  Sparkles,
  Smartphone,
  UtensilsCrossed,
} from 'lucide-react';

const PLAN_BENEFITS = [
  'Truy cập thư viện bài tập 3D đầy đủ.',
  'AI Fitnexus xây dựng kế hoạch luyện tập riêng.',
  'Theo dõi chi tiết buổi tập và tiến độ cơ thể.',
  'Sử dụng Nutrition AI để gợi ý bữa ăn lành mạnh.',
];

const FITNEXUS_FEATURES = [
  {
    icon: Activity,
    title: 'Kế hoạch tập luyện thích ứng',
    description: 'AI Fitnexus tính toán chương trình dựa trên mục tiêu và lịch sinh hoạt của bạn.',
  },
  {
    icon: Sparkles,
    title: 'Hướng dẫn AI ATP Coach',
    description: 'Nhận gợi ý thông minh, điều chỉnh độ khó một cách tự động theo tiến độ.',
  },
  {
    icon: Layers,
    title: 'Mô hình 3D cơ bắp',
    description: 'Quan sát chính xác nhóm cơ đang hoạt động và tư thế hỗ trợ kỹ thuật tập luyện.',
  },
  {
    icon: BarChart3,
    title: 'Theo dõi số liệu realtime',
    description: 'Báo cáo chi tiết số calo, thời gian tập và sự tiến bộ theo tuần.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Nutrition AI đồng hành',
    description: 'Lập thực đơn phù hợp mục tiêu giảm mỡ hay tăng cơ chỉ trong vài giây.',
  },
  {
    icon: Smartphone,
    title: 'Đồng bộ đa thiết bị',
    description: 'Luyện tập linh hoạt trên web, mobile, tablet và đồng bộ kế hoạch mỗi lúc.',
  },
  {
    icon: Dumbbell,
    title: 'Thử thách và sự kiện Fitness',
    description: 'Mở khóa các sự kiện tập trung, leaderboard và huấn luyện viên trực tuyến.',
  },
];

const formatPrice = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return `${value || 0} VND`;
  return `${num.toLocaleString('vi-VN')} VND`;
};

const calcDailyPrice = (price, durationDays) => {
  const amount = Number(price);
  const days = Number(durationDays);
  if (!amount || !days || Number.isNaN(amount) || Number.isNaN(days)) return null;
  return Math.round(amount / days);
};

const formatDate = (value) => {
  if (!value) return 'Không xác định';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Không xác định';
  return d.toLocaleDateString('vi-VN');
};

export default function Pricing() {
  const { user, loading } = useAuth();
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const isAuthenticated = !!user;
  const currentYear = new Date().getFullYear();

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

  useEffect(() => {
    if (!isAuthenticated) {
      setPurchases([]);
      return;
    }
    (async () => {
      setLoadingPurchases(true);
      try {
        const res = await listMyPurchasesApi();
        setPurchases(res?.data?.purchases || []);
      } catch (e) {
        console.warn('Không tải được purchased upgrades:', e?.message || e);
        setPurchases([]);
      } finally {
        setLoadingPurchases(false);
      }
    })();
  }, [isAuthenticated]);

  const recommendedPlanId = useMemo(() => {
    if (!plans.length) return null;
    const best = plans.reduce((acc, plan) => {
      if (!acc) return plan;
      const durationAcc = Number(acc.duration_days || 0);
      const durationPlan = Number(plan.duration_days || 0);
      if (durationPlan > durationAcc) return plan;
      if (durationPlan === durationAcc) {
        const priceAcc = Number(acc.price || 0);
        const pricePlan = Number(plan.price || 0);
        return pricePlan < priceAcc ? plan : acc;
      }
      return acc;
    }, null);
    return best?.plan_id ?? null;
  }, [plans]);

  const activePurchases = useMemo(() => purchases.filter((p) => p.isActive), [purchases]);

  const fallbackActivePurchase = useMemo(() => {
    if (activePurchases.length || user?.user_type !== 'premium') return [];
    return user?.user_exp_date
      ? [
          {
            planId: null,
            planName: 'Premium hiện tại',
            price: null,
            durationDays: null,
            status: 'completed',
            purchasedAt: null,
            activeUntil: user.user_exp_date,
            expiresAt: user.user_exp_date,
            isActive: true,
            fallback: true,
          },
        ]
      : [];
  }, [activePurchases, user?.user_type, user?.user_exp_date]);

  const displayPurchased = activePurchases.length ? activePurchases : fallbackActivePurchase;

  const purchasedPlanIds = useMemo(() => {
    const ids = new Set();
    activePurchases.forEach((p) => {
      if (p.planId) ids.add(p.planId);
    });
    return ids;
  }, [activePurchases]);

  const availablePlans = useMemo(() => {
    if (!plans.length) return [];
    if (!purchasedPlanIds.size) return plans;
    return plans.filter((plan) => !purchasedPlanIds.has(plan.plan_id));
  }, [plans, purchasedPlanIds]);

  const handlePurchase = async (planId) => {
    try {
      setBusy(true);
      const res = await createPaymentLinkApi(planId);
      const url = res?.data?.checkoutUrl;
      if (!url) throw new Error('Thiếu checkoutUrl từ PayOS');
      window.location.href = url;
    } catch (e) {
      setError(e?.response?.data || { message: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-slate-600">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900">
      {isAuthenticated ? <HeaderLogin /> : <HeaderDemo />}

      <main className="flex-1 bg-slate-50">
        <section className="px-4 pt-24 pb-16">
          <div className="flex flex-col max-w-5xl gap-4 mx-auto text-center">
            <span className="inline-flex items-center self-center gap-2 px-4 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full">
              <Sparkles className="w-4 h-4" /> Trải nghiệm Fitnexus Premium
            </span>
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Nâng cấp Fitnexus Premium để đồng bộ kế hoạch, bài tập và tiến độ của bạn – trải nghiệm tập luyện mượt mà và hiệu quả hơn bao giờ hết.
            </h1>
            <p className="max-w-3xl mx-auto text-base text-slate-600">
              Fitnexus Premium hỗ trợ AI Coach, mô hình 3D, kế hoạch cá nhân và báo cáo tiến độ chi tiết giúp bạn giữ động lực và đạt mục tiêu nhanh hơn.
            </p>
            {!isAuthenticated && (
              <p className="text-sm text-slate-500">
                Đăng nhập hoặc tạo tài khoản để mua gói Premium và bắt đầu đồng bộ Spotify ngay hôm nay.
              </p>
            )}
          </div>

          <div className="max-w-6xl mx-auto mt-10">
            {error ? (
              <div className="px-4 py-3 mb-6 text-sm text-red-700 border border-red-200 rounded-2xl bg-red-50">
                {error.message || 'Đã xảy ra lỗi, vui lòng thử lại sau.'}
              </div>
            ) : null}

            {displayPurchased.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">Purchased Upgrades</h2>
                  {loadingPurchases && <span className="text-sm text-slate-500">Đang kiểm tra…</span>}
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {displayPurchased.map((purchase) => (
                    <article
                      key={purchase.planId || purchase.transactionId || 'current'}
                      className="flex h-full flex-col rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm"
                    >
                      <header className="flex flex-col gap-1">
                        <p className="text-xs font-semibold uppercase text-emerald-500">Đang kích hoạt</p>
                        <h3 className="text-xl font-semibold text-slate-900">
                          {purchase.planName || 'Premium Access'}
                        </h3>
                        {purchase.price ? (
                          <div className="text-2xl font-bold text-emerald-600">{formatPrice(purchase.price)}</div>
                        ) : null}
                        <p className="text-sm text-slate-500">
                          Expires: {formatDate(purchase.activeUntil || purchase.expiresAt)}
                        </p>
                      </header>
                      <ul className="flex flex-col flex-1 gap-3 mt-6 text-sm text-slate-600">
                        {PLAN_BENEFITS.map((benefit) => (
                          <li key={`${benefit}-purchased`} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        disabled
                        className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-600"
                      >
                        Đang sử dụng
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availablePlans.length ? (
                availablePlans.map((plan) => {
                  const isRecommended = recommendedPlanId === plan.plan_id;
                  const perDay = calcDailyPrice(plan.price, plan.duration_days);
                  return (
                    <article
                      key={plan.plan_id}
                      className={`flex h-full flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
                        isRecommended ? 'border-indigo-400 shadow-indigo-200' : 'border-slate-200'
                      }`}
                    >
                      {isRecommended && (
                        <span className="inline-flex items-center px-3 py-1 mb-4 text-xs font-semibold text-indigo-700 uppercase bg-indigo-100 rounded-full w-fit">
                          Phổ biến nhất
                        </span>
                      )}

                      <header className="flex flex-col gap-1">
                        <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                        <div className="text-3xl font-bold text-indigo-600">{formatPrice(plan.price)}</div>
                        <p className="text-sm text-slate-500">Chu kỳ {plan.duration_days} ngày</p>
                        {perDay ? (
                          <p className="text-xs text-slate-400">Khoảng {perDay.toLocaleString('vi-VN')} VND/ngày</p>
                        ) : null}
                      </header>

                      <ul className="flex flex-col flex-1 gap-3 mt-6 text-sm text-slate-600">
                        {PLAN_BENEFITS.slice(0, 4).map((benefit) => (
                          <li key={`${plan.plan_id}-${benefit}`} className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>

                      <button
                        className="w-full px-5 py-3 mt-8 text-sm font-semibold text-white transition bg-indigo-600 rounded-full hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={busy || !isAuthenticated}
                        onClick={() => handlePurchase(plan.plan_id)}
                      >
                        {isAuthenticated ? (busy ? 'Đang xử lý...' : 'Thanh toán và nâng cấp') : 'Đăng nhập để mua'}
                      </button>
                      <p className="mt-3 text-xs text-slate-400">
                        Premium sẽ được kích hoạt với tài khoản Fitnexus của bạn ngay sau khi thanh toán thành công.
                      </p>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center p-10 text-center bg-white border border-dashed shadow-sm rounded-2xl border-slate-200 text-slate-500">
                  {user?.user_type === 'premium'
                    ? 'Bạn đã sở hữu gói Premium hiện tại.'
                    : 'Hiện chưa có gói Premium nào khả dụng. Vui lòng quay lại sau.'}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl px-4 mx-auto">
            <div className="max-w-3xl mb-10">
              <h2 className="text-2xl font-semibold text-slate-900"> Premium tích hợp giúp bạn tập tốt hơn</h2>
              <p className="mt-3 text-base text-slate-600">
                Tổng hợp những tính năng chỉ có ở gói Premium của Fitnexus. Mỗi mục được đồng bộ với các module sẵn có trong dự án: AI Trainer, Nutrition AI, Onboarding và thống kê tiến độ.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {FITNEXUS_FEATURES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="p-6 bg-white border shadow-sm rounded-2xl border-slate-200">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-indigo-600 rounded-full bg-indigo-50">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200">
        <div className="flex flex-col w-full max-w-6xl gap-4 px-4 py-8 mx-auto text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>&copy; {currentYear} Fitnexus. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a href="/support/faq" className="transition hover:text-slate-700">Hỗ trợ</a>
            <a href="/nutrition-ai" className="transition hover:text-slate-700">Nutrition AI</a>
            <a href="/modeling-demo" className="transition hover:text-slate-700">Modeling 3D</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
