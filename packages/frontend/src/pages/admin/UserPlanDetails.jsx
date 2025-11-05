// packages/frontend/src/pages/admin/UserPlanDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { ArrowLeft, Globe2, Lock, Dumbbell, Clock, Mail } from 'lucide-react';

export default function UserPlanDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const userFromState = location.state?.user || null;

  const [user, setUser] = useState(userFromState);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null); // giữ để highlight item đã nhấn
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/admin/users/${userId}/plans`);
        const ok = res?.data?.success;
        const data = res?.data?.data || {};
        if (!mounted) return;

        if (ok) {
          if (data.user) setUser(data.user);
          const list = Array.isArray(data.plans) ? data.plans : [];
          setPlans(list);
          if (list.length && !selectedPlan) setSelectedPlan(list[0]);
        } else {
          setPlans([]);
          setSelectedPlan(null);
        }
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to fetch data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPlans();
    return () => { mounted = false; };
  }, [userId]);

  const Badge = ({ on, children }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        ${on ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}
    >
      {on ? <Globe2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
      {children}
    </span>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="h-9 w-64 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-white border rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="text-red-700 bg-red-50 border border-red-200 p-5 rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8 flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 hover:bg-gray-100 rounded-xl border border-transparent hover:border-gray-200 transition"
          title="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Kế hoạch của {user?.username || `user #${userId}`}
          </h1>
          {user?.email && (
            <p className="mt-2 inline-flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </p>
          )}
        </div>
      </div>

      {/* Only the list (no right panel) */}
      <div className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50/70 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Danh sách kế hoạch</h2>
          <span className="text-xs text-gray-500">{plans.length} kế hoạch</span>
        </div>

        <div className="p-4">
          {plans.length === 0 ? (
            <div className="text-gray-500 text-center py-10">Chưa có plan nào</div>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-4">
              {plans.map((p) => {
                const isActive = selectedPlan?.plan_id === p.plan_id;
                return (
                  <li key={p.plan_id}>
                    <button
                      onClick={() => {
                        setSelectedPlan(p);
                        navigate(`/admin/user-plans/${userId}/plan/${p.plan_id}`, {
                          state: { user },
                        });
                      }}
                      className={`w-full text-left rounded-2xl border transition shadow-sm
                        ${isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                    >
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate text-[15px]">
                              {p.name || '(Không tên)'}
                            </div>
                            {p.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {p.description}
                              </p>
                            )}
                          </div>
                          <Badge on={!!p.is_public}>
                            {p.is_public ? 'Công khai' : 'Riêng tư'}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-5 text-xs text-gray-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Dumbbell className="w-4 h-4" />
                            {(p.items?.length ?? 0)} bài tập
                          </span>
                          {p.difficulty_level && (
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              {p.difficulty_level}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
