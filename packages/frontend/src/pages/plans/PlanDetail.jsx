import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import { 
  getPlanByIdApi, 
  reorderPlanExercisesApi, 
  updatePlanExerciseApi,
  api 
} from "../../lib/api.js";
import { listWorkoutSessionsApi } from "../../lib/api.js";

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

// Modal chỉnh sửa thông số bài tập trong plan
function EditExerciseModal({ exercise, onClose, onSave }) {
  const [sets, setSets] = useState(exercise?.sets_recommended ?? "");
  const [reps, setReps] = useState(exercise?.reps_recommended ?? "");
  const [rest, setRest] = useState(exercise?.rest_period_seconds ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        sets_recommended: sets !== "" ? parseInt(sets, 10) : null,
        reps_recommended: reps !== "" ? String(reps) : null,
        rest_period_seconds: rest !== "" ? parseInt(rest, 10) : null,
      });
      onClose();
    } catch (e) {
      // giữ modal mở để người dùng thử lại
      console.error("Save exercise settings error:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md p-6 mx-4 bg-white rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-semibold">Chỉnh sửa bài tập</h3>
        <p className="mb-4 text-sm text-gray-600">{exercise?.exercise?.name || `#${exercise?.exercise_id}`}</p>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Số sets</label>
            <input
              type="number"
              min="0"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="VD: 3"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Số reps</label>
            <input
              type="text"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="VD: 8-12 hoặc 15"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Nghỉ (giây)</label>
            <input
              type="number"
              min="0"
              value={rest}
              onChange={(e) => setRest(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="VD: 60"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Hủy
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-800 disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResumeRestartModal({ activeSession, onClose, onResume, onRestart }) {
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    if (diffMins > 0) return `${diffMins} phút trước`;
    return 'vừa xong';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          Bạn có buổi tập đang dở
        </h3>
        
        <div className="mb-6">
          <p className="mb-3 text-sm text-gray-600">
            <span className="font-medium text-gray-900">{activeSession.plan_name}</span>
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Lần cuối tập:</span>
              <span className="font-medium text-blue-600">
                {getTimeAgo(activeSession.updated_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiến độ:</span>
              <span className="font-medium text-gray-900">
                {activeSession.current_exercise_index + 1} / {activeSession.exercises_count} bài
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái:</span>
              <span className={`font-medium ${
                activeSession.status === 'paused' ? 'text-amber-600' : 'text-green-600'
              }`}>
                {activeSession.status === 'paused' ? 'Đã tạm dừng' : 'Đang tập'}
              </span>
            </div>
          </div>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Bạn muốn tiếp tục buổi tập này hay bắt đầu lại từ đầu?
        </p>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full px-4 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700"
          >
            Tiếp tục buổi tập
          </button>
          
          <button
            onClick={onRestart}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Bắt đầu lại từ đầu
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal: Có session đang dở thuộc plan KHÁC
function ActiveOtherPlanModal({ activeSession, currentPlanName, onClose, onContinueOther, onFinishOtherThenStart }) {
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    if (diffMins > 0) return `${diffMins} phút trước`;
    return 'vừa xong';
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="w-full max-w-md p-6 mx-4 bg-white shadow-2xl rounded-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">Bạn đang có buổi tập ở kế hoạch khác</h3>
        <div className="mb-4 text-sm text-gray-600">
          <div>
            Kế hoạch đang dở: <span className="font-medium text-gray-900">{activeSession.plan_name || `#${activeSession.plan_id}`}</span>
          </div>
          <div className="mt-1">Tiến độ: {activeSession.current_exercise_index + 1} / {activeSession.exercises_count} bài • Lần cuối: {getTimeAgo(activeSession.updated_at)}</div>
          <div className="mt-2">Kế hoạch bạn đang mở: <span className="font-medium">{currentPlanName}</span></div>
        </div>
        <div className="space-y-3">
          <button onClick={onContinueOther} className="w-full px-4 py-3 text-sm font-semibold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700">Tiếp tục buổi đang dở</button>
          <button onClick={onFinishOtherThenStart} className="w-full px-4 py-3 text-sm font-medium text-gray-700 transition-colors border-2 border-gray-300 rounded-lg hover:bg-gray-50">Kết thúc buổi đó và bắt đầu kế hoạch này</button>
          <button onClick={onClose} className="w-full px-4 py-3 text-sm text-gray-500 transition-colors hover:text-gray-700">Để sau</button>
        </div>
      </div>
    </div>
  );
}

export default function PlanDetail() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showOtherPlanModal, setShowOtherPlanModal] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPlanByIdApi(planId);
        if (!alive) return;
        if (res?.success) {
          setPlan(res.data?.plan || null);
          setItems(res.data?.items || []);
        } else {
          setError({ message: res?.message || "Không thể tải kế hoạch" });
        }
      } catch (e) {
        if (alive) setError({ message: e?.message || "Lỗi kết nối" });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    // load sessions
    (async () => {
      try {
        const r1 = await listWorkoutSessionsApi({ planId: Number(planId), status: 'active' });
        const r2 = await listWorkoutSessionsApi({ planId: Number(planId), status: 'completed' });
        setActiveSessions(r1?.data?.items || []);
        setCompletedSessions(r2?.data?.items || []);
      } catch {}
    })();
    return () => { alive = false; };
  }, [planId]);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setItems(newItems);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const updates = items.map((item, idx) => ({
        plan_exercise_id: item.plan_exercise_id,
        session_order: idx + 1
      }));

      const res = await reorderPlanExercisesApi(planId, updates);
      
      if (!res?.success) {
        const reloadRes = await getPlanByIdApi(planId);
        if (reloadRes?.success) {
          setItems(reloadRes.data?.items || []);
        }
        setError({ message: res?.message || "Không thể lưu thứ tự mới" });
      } else {
        setError(null);
      }
    } catch (e) {
      console.error("Reorder error:", e);
      const reloadRes = await getPlanByIdApi(planId);
      if (reloadRes?.success) {
        setItems(reloadRes.data?.items || []);
      }
      setError({ message: "Không thể lưu thứ tự mới" });
    } finally {
      setDraggedIndex(null);
      setSaving(false);
    }
  };

  const handleEditExercise = async (exercise, data) => {
    try {
      const res = await updatePlanExerciseApi(planId, exercise.plan_exercise_id, data);
      
      if (res?.success) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.plan_exercise_id === exercise.plan_exercise_id
              ? { ...item, ...data }
              : item
          )
        );
        setError(null);
      } else {
        setError({ message: res?.message || "Không thể cập nhật bài tập" });
      }
    } catch (err) {
      console.error("Update exercise error:", err);
      setError({ message: "Không thể cập nhật bài tập" });
    }
  };

  // ============ WORKOUT START FLOW ============
  const startWorkout = async () => {
    setStartingWorkout(true);
    setError(null);

    try {
      // 1. Check có session active không
      const activeRes = await api.get('/api/workout/active');
      const activeSess = activeRes?.data?.data?.session || null;

      if (!activeSess) {
        await createNewSession();
      } else if (Number(activeSess.plan_id) === Number(planId)) {
        // Cùng plan -> hỏi tiếp tục hay bắt đầu lại
        setActiveSession(activeSess);
        setShowResumeModal(true);
      } else {
        // KHÁC plan: hiển thị modal lựa chọn (không tự động kết thúc)
        setActiveSession(activeSess);
        setShowOtherPlanModal(true);
      }
    } catch (err) {
      console.error("Check active session error:", err);
      setError({ message: "Không thể kiểm tra buổi tập hiện tại" });
    } finally {
      setStartingWorkout(false);
    }
  };

  const createNewSession = async () => {
    try {
      const res = await api.post('/api/workout', { 
        plan_id: Number(planId),
        notes: null
      });

      if (res.data.success) {
        navigate(`/workout-run/${res.data.data.session_id}`);
      } else {
        setError({ message: res.data.message || "Không thể tạo buổi tập" });
      }
    } catch (err) {
      console.error("Create session error:", err);
      
      if (err.response?.status === 409) {
        // Race condition - có session được tạo trong lúc check
        const sessionData = err.response.data.data;
        setActiveSession(sessionData);
        setShowResumeModal(true);
      } else {
        setError({ message: "Không thể tạo buổi tập" });
      }
    }
  };

  const handleResume = () => {
    setShowResumeModal(false);
    navigate(`/workout-run/${activeSession.session_id}`);
  };

  const handleRestart = async () => {
    // Mục tiêu: bắt đầu lại từ KẾ HOẠCH HIỆN TẠI (planId),
    // nên hoàn tất session cũ (nếu có) rồi tạo session mới từ plan hiện tại.
    setShowResumeModal(false);
    setStartingWorkout(true);
    try {
      if (activeSession?.session_id) {
        try { await api.post(`/api/workout/${activeSession.session_id}/complete`); } catch {}
      }
      await createNewSession();
    } catch (err) {
      console.error('Restart (complete+create) error:', err);
      setError({ message: 'Không thể bắt đầu lại buổi tập' });
    } finally {
      setStartingWorkout(false);
    }
  };

  // Modal khác plan
  const handleContinueOther = () => {
    setShowOtherPlanModal(false);
    if (activeSession?.session_id) navigate(`/workout-run/${activeSession.session_id}`);
  };
  const handleFinishOtherThenStart = async () => {
    setShowOtherPlanModal(false);
    setStartingWorkout(true);
    try {
      if (activeSession?.session_id) {
        try { await api.post(`/api/workout/${activeSession.session_id}/complete`); } catch {}
      }
      await createNewSession();
    } catch (e) {
      setError({ message: 'Không thể bắt đầu buổi mới' });
    } finally {
      setStartingWorkout(false);
    }
  };


  return (
    <div className="min-h-screen text-gray-900 bg-white">
      <HeaderLogin />
      <main className="max-w-5xl px-4 py-6 mx-auto">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:underline"
        >
          ← Quay lại
        </button>

        {loading && <div className="p-4 text-sm text-gray-600">Đang tải kế hoạch...</div>}
        {error && !loading && (
          <div className="p-4 mb-4 text-sm text-red-600 border border-red-200 rounded bg-red-50">
            {error.message}
          </div>
        )}
        {saving && (
          <div className="p-4 mb-4 text-sm text-blue-600 border border-blue-200 rounded bg-blue-50">
            Đang lưu thứ tự mới...
          </div>
        )}

        {plan && !loading && (
          <div className="space-y-6">
            <div className="p-5 bg-white border rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">{plan.name || "(Không có tên)"}</h1>
                  {plan.description && (
                    <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                  )}
                  <div className="mt-2">
                    {plan.difficulty_level && (
                      <Badge tone="amber">Độ khó: {plan.difficulty_level}</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={() => {
                      try {
                        const ctx = {
                          plan_id: Number(planId),
                          name: plan?.name || '',
                        };
                        sessionStorage.setItem('current_plan_context', JSON.stringify(ctx));
                      } catch {}
                      navigate('/exercises');
                    }}
                  >
                    Thêm bài tập từ Thư viện
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={startWorkout}
                    disabled={startingWorkout || !items.length}
                  >
                    {startingWorkout ? 'Đang chuẩn bị...' : 'Bắt đầu tập'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white border rounded-xl">
              <h2 className="mb-3 text-lg font-semibold">Bài tập trong kế hoạch</h2>
              <p className="mb-4 text-sm text-gray-500">Kéo thả để sắp xếp lại thứ tự bài tập</p>
              
              {!items.length ? (
                <div className="text-sm text-gray-600">Chưa có bài tập nào. Hãy thêm từ Thư viện.</div>
              ) : (
                <div className="space-y-3">
                  {items.map((it, index) => (
                    <div
                      key={it.plan_exercise_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-start justify-between gap-3 p-3 border rounded-lg cursor-move transition-all ${
                        draggedIndex === index ? 'opacity-50 border-blue-400' : 'hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-start flex-1 min-w-0 gap-3">
                        <div className="flex flex-col items-center justify-center pt-1 text-gray-400">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded">
                              #{index + 1}
                            </span>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {it.exercise?.name || `#${it.exercise_id}`}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {it.exercise?.difficulty && (
                              <Badge tone="amber">{it.exercise.difficulty}</Badge>
                            )}
                            {it.exercise?.equipment && (
                              <Badge tone="blue">{it.exercise.equipment}</Badge>
                            )}
                            {it.sets_recommended && (
                              <Badge tone="green">{it.sets_recommended} sets</Badge>
                            )}
                            {it.reps_recommended && (
                              <Badge tone="purple">{it.reps_recommended} reps</Badge>
                            )}
                            {it.rest_period_seconds !== null && it.rest_period_seconds !== undefined && (
                              <Badge tone="gray">Nghỉ: {it.rest_period_seconds}s</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="px-3 py-1.5 text-sm text-blue-400 border border-blue-200 rounded hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingExercise(it);
                          }}
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded hover:bg-gray-50"
                          onClick={() => navigate(`/exercises/${it.exercise?.id || it.exercise_id}`)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sessions overview */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="p-5 bg-white border rounded-xl">
                <h3 className="mb-2 text-base font-semibold text-gray-900">Chưa hoàn thành</h3>
                {!activeSessions.length ? (
                  <div className="text-sm text-gray-600">Chưa có buổi tập nào hoặc không có buổi đang dở.</div>
                ) : (
                  <div className="space-y-2">
                    {activeSessions.map((s) => (
                      <div key={s.session_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">Bắt đầu: {new Date(s.started_at).toLocaleString()}</div>
                          <div className="text-xs text-gray-600">Tiến độ: {s.completed_exercises}/{s.total_exercises}</div>
                        </div>
                        <button className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50" onClick={() => navigate(`/workout-run/${s.session_id}`)}>Tiếp tục</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 bg-white border rounded-xl">
                <h3 className="mb-2 text-base font-semibold text-gray-900">Đã hoàn thành</h3>
                {!completedSessions.length ? (
                  <div className="text-sm text-gray-600">Chưa có buổi hoàn thành.</div>
                ) : (
                  <div className="space-y-2">
                    {completedSessions.map((s) => (
                      <div key={s.session_id} className="p-3 border rounded-lg">
                        <div className="text-sm font-medium text-gray-900">Ngày tập: {new Date(s.ended_at || s.started_at).toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Tổng thời gian: {formatDuration(s.total_duration_seconds)}</div>
                        <div className="text-xs text-gray-600">Hoàn thành: {s.completed_exercises}/{s.total_exercises}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showResumeModal && activeSession && (
          <ResumeRestartModal
            activeSession={activeSession}
            onClose={() => setShowResumeModal(false)}
            onResume={handleResume}
            onRestart={handleRestart}
          />
        )}
        {editingExercise && (
          <EditExerciseModal
            exercise={editingExercise}
            onClose={() => setEditingExercise(null)}
            onSave={(data) => handleEditExercise(editingExercise, data)}
          />
        )}
        {showOtherPlanModal && activeSession && (
          <ActiveOtherPlanModal
            activeSession={activeSession}
            currentPlanName={plan?.name || `(Kế hoạch ${planId})`}
            onClose={() => setShowOtherPlanModal(false)}
            onContinueOther={handleContinueOther}
            onFinishOtherThenStart={handleFinishOtherThenStart}
          />
        )}
      </main>
    </div>
  );
}

function formatDuration(sec = 0) {
  const s = Number(sec) || 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}h ${m}m ${r}s`;
  if (m > 0) return `${m}m ${r}s`;
  return `${r}s`;
}
