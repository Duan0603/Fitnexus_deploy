import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { api, getMyPlansApi, deletePlanApi, addExerciseToPlanApi, listWorkoutSessionsApi } from "../../lib/api.js";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

function NoPlansModal({ onClose, onCreatePlan }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Chưa có kế hoạch luyện tập
        </h3>
        <p className="mb-6 text-sm text-gray-600">
          Bạn cần tạo một kế hoạch trước khi thêm bài tập. Bạn có muốn tạo kế hoạch mới ngay bây giờ không?
        </p>
        <div className="space-y-3">
          <button onClick={onCreatePlan} className="w-full px-4 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700">
            Tạo kế hoạch mới
          </button>
          <button onClick={onClose} className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-50">
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmationModal({ planName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-xl font-semibold text-red-800">Xác nhận xóa</h3>
        <p className="mb-6 text-sm text-gray-600">
          Bạn có chắc chắn muốn xóa kế hoạch "<b>{planName}</b>"? Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
            Hủy
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">
            Xóa kế hoạch
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PlanManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [showNoPlansModal, setShowNoPlansModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completedPlanIds, setCompletedPlanIds] = useState(new Set());

  const exerciseId = useMemo(() => {
    const v = parseInt(searchParams.get("exerciseId"), 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [searchParams]);
  const exerciseName = useMemo(() => location.state?.exerciseName || "", [location.state]);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/plans', { 
        params: { mine: 1, limit: 200, offset: 0 } 
      });
      const planItems = res?.data?.items ?? res?.data ?? [];
      const plans = Array.isArray(planItems) ? planItems : [];
      setPlans(plans);

      if (plans.length === 0 && exerciseId) {
        setShowNoPlansModal(true);
      }

      // Fetch completed sessions to partition plans
      try {
        const sess = await listWorkoutSessionsApi({ status: 'completed', limit: 100, offset: 0 });
        const itemsSess = sess?.data?.items ?? sess?.data ?? [];
        const setIds = new Set((Array.isArray(itemsSess) ? itemsSess : []).map((s) => s.plan_id).filter((v) => Number.isFinite(v)));
        setCompletedPlanIds(setIds);
      } catch {}
    } catch (e) {
      setError("Không thể tải danh sách kế hoạch.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleAddToSelected = async () => {
    if (!exerciseId || !selectedPlanId) return;
    setSaving(true);
    setError(null);
    try {
      await addExerciseToPlanApi({
        planId: selectedPlanId,
        exercise_id: exerciseId,
        sets_recommended: 3,
        reps_recommended: "8-12",
        rest_period_seconds: 60,
      });
      navigate("/exercises", {
        replace: true,
        state: {
          toast: "Thêm bài tập thành công",
          addedExerciseName: exerciseName,
        },
      });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể thêm vào plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    try {
      await deletePlanApi(planId);
      setPlans(plans.filter((p) => p.plan_id !== planId));
      setDeletingPlan(null); // Close modal on success
    } catch (err) {
      // Hiển thị lỗi cụ thể hơn nếu có
      setError("Xóa kế hoạch thất bại. Vui lòng thử lại.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderLogin />
      <div className="max-w-4xl px-4 py-10 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {exerciseId ? "Chọn kế hoạch để thêm bài tập" : "Quản lý Kế hoạch"}
          </h1>
          <button
            onClick={() => navigate(exerciseId ? `/plans/new?exerciseId=${exerciseId}`: "/plans/new")}
            className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Tạo kế hoạch mới
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded-md bg-red-50">
            {error}
          </div>
        )}

        {loading ? (
          <p>Đang tải...</p>
        ) : plans.length === 0 && !exerciseId ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">Bạn chưa có kế hoạch nào.</p>
            <button
              onClick={() => navigate("/plans/new")}
              className="mt-4 px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
            >
              Tạo ngay
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.plan_id} className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm ${selectedPlanId === plan.plan_id ? 'border-blue-500' : ''}`}>
                {exerciseId && (
                  <input
                    type="radio"
                    name="picked_plan"
                    value={plan.plan_id}
                    checked={selectedPlanId === plan.plan_id}
                    onChange={() => setSelectedPlanId(plan.plan_id)}
                    className="mr-4"
                  />
                )}
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800">{plan.name}</h2>
                  <p className="text-sm text-gray-500">{plan.description || "Không có mô tả"}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/plans/${plan.plan_id}`)}
                    className="px-3 py-1 text-sm text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => navigate(`/plans/edit/${plan.plan_id}`)}
                    className="px-3 py-1 text-sm text-yellow-600 border border-yellow-200 rounded-md hover:bg-yellow-50"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => setDeletingPlan(plan)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {exerciseId && (
          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              disabled={!selectedPlanId || saving}
              onClick={handleAddToSelected}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Đang thêm..." : "Thêm vào plan đã chọn"}
            </button>
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Trở lại Thư viện
            </button>
          </div>
        )}
      </div>

      {deletingPlan && (
        <DeleteConfirmationModal
          planName={deletingPlan.name}
          onConfirm={() => handleDelete(deletingPlan.plan_id)}
          onCancel={() => setDeletingPlan(null)}
        />
      )}
      {showNoPlansModal && (
        <NoPlansModal
          onClose={() => {
            setShowNoPlansModal(false);
            navigate('/exercises');
          }}
          onCreatePlan={() => navigate(`/plans/new?exerciseId=${exerciseId}`)}
        />
      )}
    </div>
  );
}