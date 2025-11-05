// packages/frontend/src/pages/admin/AdminPlanDetail.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { api, endpoints } from '../../lib/api';
import { ArrowLeft, Globe2, Lock, Dumbbell, Clock, Loader2 } from 'lucide-react';

export default function AdminPlanDetail() {
  const navigate = useNavigate();
  const { userId, planId } = useParams();
  const location = useLocation();
  const userFromState = location.state?.user || null;

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.get(endpoints.admin.userPlanDetail(userId, planId));
        if (res.data?.success) { setPlan(res.data.data.plan); }
        else setError('Không tải được chi tiết kế hoạch');
      } catch (e) {
        setError(e?.response?.data?.message || 'Lỗi khi tải chi tiết kế hoạch');
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

  const Badge = ({ on, children }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${on ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {on ? <Globe2 className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
      {children}
    </span>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/user-plans/${userId}`, { state: { user: userFromState } })}
          className="p-2 hover:bg-gray-100 rounded-full border border-transparent hover:border-gray-200 transition"
          title="Quay lại danh sách kế hoạch"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chi tiết kế hoạch</h1>
          <div className="mt-1 text-sm text-gray-500">
            Người dùng:&nbsp;
            {userFromState?.username
              ? <span className="font-medium text-gray-700">{userFromState.username}</span>
              : <span className="text-gray-400">#{userId}</span>}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border rounded-2xl p-10 text-center">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            Đang tải chi tiết kế hoạch...
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">{error}</div>
      ) : !plan ? (
        <div className="bg-gray-50 border rounded-2xl p-10 text-center text-gray-500">Không có dữ liệu kế hoạch</div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden">
          {/* Plan meta */}
          <div className="px-6 py-5 border-b bg-white/80">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-gray-900 truncate">{plan.name}</h2>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{plan.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    <Dumbbell className="w-4 h-4" />
                    {(plan.exercises?.length || plan.items?.length || 0)} bài tập
                  </span>
                  {plan.difficulty_level && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {plan.difficulty_level}
                    </span>
                  )}
                </div>
              </div>
              <Badge on={!!plan.is_public}>{plan.is_public ? 'Công khai' : 'Riêng tư'}</Badge>
            </div>
          </div>

          {/* Exercises */}
          <div className="p-6">
            <h3 className="font-medium text-gray-900 mb-4">Danh sách bài tập</h3>

            {((plan.exercises && plan.exercises.length) || (plan.items && plan.items.length)) ? (
              <ul className="space-y-3">
                {(plan.exercises || plan.items).map((row, idx) => {
                  const ex = row.exercise || row;
                  const key = ex.exercise_id ?? `${idx}`;
                  return (
                    <li key={key} className="border rounded-xl p-4 hover:bg-gray-50 transition">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {idx + 1}. {ex.name || ex.name_en || 'Bài tập'}
                        </div>
                        {ex.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-3">{ex.description}</p>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div className="px-3 py-2 rounded-lg bg-gray-50 border">
                          <span className="text-gray-500">Sets: </span>
                          <span className="font-medium">{row.sets_recommended ?? '-'}</span>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-gray-50 border">
                          <span className="text-gray-500">Reps: </span>
                          <span className="font-medium">{row.reps_recommended ?? '-'}</span>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-gray-50 border">
                          <span className="text-gray-500">Rest: </span>
                          <span className="font-medium">
                            {row.rest_period_seconds != null ? `${row.rest_period_seconds}s` : '-'}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center text-gray-500 py-10">Chưa có bài tập nào trong kế hoạch này</div>
            )}
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/admin/user-plans/${userId}`, { state: { user: userFromState } })}
          className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50"
        >
          Quay lại danh sách
        </button>

        <Link
          to={`/admin/user-plans/${userId}`}
          state={{ user: userFromState }}
          className="text-sm text-blue-600 hover:underline"
        >
          Xem tất cả kế hoạch của user
        </Link>
      </div>
    </div>
  );
}
