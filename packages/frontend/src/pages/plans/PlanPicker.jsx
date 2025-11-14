import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import { getMyPlansApi, addExerciseToPlanApi, listWorkoutSessionsApi, deletePlanApi } from "../../lib/api.js";

export default function PlanPicker() {
  // Modal hiển thị khi người dùng chưa có plan nào
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

  // Modal xác nhận xóa plan
  function DeleteConfirmationModal({ planName, onConfirm, onCancel, isDeleting }) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
        <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-xl" onClick={(e) => e.stopPropagation()}>
          <h3 className="mb-2 text-xl font-semibold text-red-800">Xác nhận xóa</h3>
          <p className="mb-6 text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa kế hoạch "<b>{planName}</b>"? Hành động này không thể hoàn tác.
          </p>
          <div className="flex gap-4">
            <button onClick={onCancel} disabled={isDeleting} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              Hủy
            </button>
            <button onClick={onConfirm} disabled={isDeleting} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60">
              {isDeleting ? "Đang xóa..." : "Xóa kế hoạch"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const exerciseId = useMemo(() => {
    const v = parseInt(searchParams.get("exerciseId"), 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [searchParams]);
  const exerciseName = useMemo(() => location.state?.exerciseName || "", [location.state]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [items, setItems] = useState([]);
  const [completedPlanIds, setCompletedPlanIds] = useState(new Set());
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showNoPlansModal, setShowNoPlansModal] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null); // State cho modal xóa
  const [isDeleting, setIsDeleting] = useState(false);
  const [saving, setSaving] = useState(false);


  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyPlansApi({ limit: 100, offset: 0 });
      const list = res?.data?.items ?? res?.data ?? [];
      const plans = Array.isArray(list) ? list : [];
      setItems(plans);

      if (plans.length === 0) {
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
      // Nếu BE chưa có endpoint list, im lặng và để người dùng tạo mới
      setShowNoPlansModal(true);
      setItems([]);
      setCompletedPlanIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddToSelected = async () => {
    // Nếu chưa có plan nào, hiển thị modal yêu cầu tạo plan
    if (items.length === 0) {
      setShowNoPlansModal(true);
      return;
    }

    // Nếu có plan nhưng chưa chọn, hiển thị lỗi
    if (!exerciseId || !selectedPlanId) return; // Nút đã disabled nên trường hợp này ít xảy ra
    setSaving(true);
    setError(null);
    try {
      const resData = await addExerciseToPlanApi({
        planId: selectedPlanId,
        exercise_id: exerciseId,
        sets_recommended: 3,
        reps_recommended: "8-12",
        rest_period_seconds: 60,
      });
      // Cập nhật session current_plan_context để Exercises biết plan hiện tại
      try {
        const picked = (items || []).find((p) => p.plan_id === selectedPlanId);
        const ctx = { plan_id: selectedPlanId, name: picked?.name || "" };
        sessionStorage.setItem("current_plan_context", JSON.stringify(ctx));
      } catch {}
      // Lấy tổng số bài tập từ response nếu BE có trả về (không gọi endpoint khác)
      const planItemCount = (() => {
        const d = resData;
        if (!d || typeof d !== 'object') return undefined;
        if (typeof d.plan_item_count === 'number') return d.plan_item_count;
        if (typeof d.items_count === 'number') return d.items_count;
        if (typeof d.total_items === 'number') return d.total_items;
        if (typeof d.total === 'number') return d.total;
        if (typeof d.count === 'number') return d.count;
        if (Array.isArray(d.items)) return d.items.length;
        if (Array.isArray(d.data?.items)) return d.data.items.length;
        if (Array.isArray(d.data)) return d.data.length;
        return undefined;
      })();

      // Nếu BE trả về tên bài tập, ưu tiên dùng; nếu không fallback từ state
      const serverExerciseName = resData?.exercise_name || resData?.exercise?.name || resData?.data?.exercise?.name;
      const addedExerciseName = serverExerciseName || exerciseName || "";

      // Điều hướng về trang bài tập và hiển thị thông báo nhỏ trong sidebar
      navigate("/exercises", {
        replace: true,
        state: {
          toast: "Thêm bài tập thành công",
          addedExerciseName,
          planItemCount,
        },
      });
    } catch (e) {
      setError({ message: e?.response?.data?.message || e?.message || "Không thể thêm vào plan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId) => {
    setIsDeleting(true);
    setError(null);
    try {
      await deletePlanApi(planId);
      // Xóa plan khỏi state để cập nhật UI
      setItems(prevItems => prevItems.filter(p => p.plan_id !== planId));
      if (selectedPlanId === planId) {
        setSelectedPlanId(null); // Bỏ chọn nếu plan đang được chọn bị xóa
      }
      setDeletingPlan(null); // Đóng modal
    } catch (err) {
      setError({ message: err?.response?.data?.message || "Xóa kế hoạch thất bại." });
    } finally {
      setIsDeleting(false);
    }
  };
  // Removed quick-create handler per request

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl px-4 py-10 mx-auto">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Chọn kế hoạch để thêm bài tập</h1>
        {exerciseId ? (
          <div className="mb-4 text-sm text-gray-600">Bài tập chọn: ID <b>{exerciseId}</b></div>
        ) : (
          <div className="mb-4 text-sm text-gray-600">Không có bài tập được chọn. Hãy quay lại Thư viện để chọn.</div>
        )}

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">{error.message}</div>
        )}

        {/* My plans */}
        <div className="p-5 mb-6 bg-white border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Kế hoạch của tôi</h2>
            <button
              type="button"
              onClick={load}
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Tải lại
            </button>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Đang tải danh sách plan...</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-500">Bạn chưa có kế hoạch nào.</div>
          ) : (
            <div className="space-y-4">
              {/* Chưa hoàn thành */}
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-800">Chưa hoàn thành</div>
                <div className="space-y-2">
                  {items.filter((p) => !completedPlanIds.has(p.plan_id)).map((p) => (
                    <label key={p.plan_id} className="flex items-center justify-between gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="picked_plan"
                        value={p.plan_id}
                        checked={selectedPlanId === p.plan_id}
                        onChange={() => setSelectedPlanId(p.plan_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{p.name || '(Không có tên)'}</div>
                        {p.description && (
                          <div className="text-xs text-gray-600 truncate">{p.description}</div>
                        )}
                        {p.difficulty_level && (
                          <div className="text-xs text-gray-500">Độ khó: {p.difficulty_level}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/plans/${p.plan_id}`); }}
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingPlan(p); }}
                        >
                          Xóa
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Đã hoàn thành */}
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-800">Đã hoàn thành</div>
                {Array.from(completedPlanIds).length === 0 ? (
                  <div className="text-xs text-gray-500">Chưa có kế hoạch hoàn thành</div>
                ) : (
                  <div className="space-y-2">
                    {items.filter((p) => completedPlanIds.has(p.plan_id)).map((p) => (
                      <label key={p.plan_id} className="flex items-center justify-between gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="picked_plan"
                          value={p.plan_id}
                          checked={selectedPlanId === p.plan_id}
                          onChange={() => setSelectedPlanId(p.plan_id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{p.name || '(Không có tên)'}</div>
                          {p.description && (
                            <div className="text-xs text-gray-600 truncate">{p.description}</div>
                          )}
                          {p.difficulty_level && (
                            <div className="text-xs text-gray-500">Độ khó: {p.difficulty_level}</div>
                          )}
                          <div className="mt-1 text-xs text-green-700">Đã từng hoàn thành</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/plans/${p.plan_id}`); }}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingPlan(p); }}
                          >
                            Xóa
                          </button>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button
              type="button"
              disabled={(items.length > 0 && !selectedPlanId) || !exerciseId || saving}
              onClick={handleAddToSelected}
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Thêm vào plan đã chọn
            </button>
            <button
              type="button"
              onClick={() => navigate('/exercises')}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Trở lại Thư viện
            </button>
          </div>
        </div>

        {/* Quick create removed as requested */}
        {showNoPlansModal && (
          <NoPlansModal
            onClose={() => setShowNoPlansModal(false)}
            onCreatePlan={() => navigate(`/plans/new?exerciseId=${exerciseId}`)}
          />
        )}
        {deletingPlan && (
          <DeleteConfirmationModal
            planName={deletingPlan.name}
            onConfirm={() => handleDelete(deletingPlan.plan_id)}
            onCancel={() => setDeletingPlan(null)}
            isDeleting={isDeleting}
          />
        )}
      </div>
    </div>
  );
}
