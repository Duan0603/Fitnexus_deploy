import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { addExerciseToPlanApi, getPlanByIdApi } from "../../lib/api.js";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";
import axios from "axios";

// Icons (images) reused from demo for visual consistency
import absIcon from "../../assets/body/coreIcon.svg";
import backIcon from "../../assets/body/backIcon.svg";
import bicepsIcon from "../../assets/body/bicepsIcon.svg";
import cardioIcon from "../../assets/body/cardioIcon.svg";
import chestIcon from "../../assets/body/chestIcon.svg";
import forearmsIcon from "../../assets/body/forearmsIcon.svg";
import glutesIcon from "../../assets/body/glutesIcon.svg";
import shouldersIcon from "../../assets/body/shouldersIcon.svg";
import tricepsIcon from "../../assets/body/tricepsIcon.svg";
import upperLegsIcon from "../../assets/body/upperLegsIcon.svg";
import lowerLegsIcon from "../../assets/body/lowerLegsIcon.svg";
import StartWorkoutButton from "../../components/workout/StartWorkoutButton.jsx";


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

// Helpers (ported from demo and expanded)
const normalizeStr = (v) => String(v || "").toLowerCase().trim();
const groupSynonyms = {
  abs: ["abs", "abdominals", "core", "stomach", "rectus-abdominis", "obliques"],
  back: ["back", "lats", "latissimus", "lower back", "upper back", "trapezius", "rhomboids"],
  biceps: ["biceps", "biceps-brachii", "brachialis"],
  cardio: ["cardio", "aerobic"],
  chest: ["chest", "pectorals", "pecs", "upper-chest", "mid-chest", "lower-chest"],
  forearms: ["forearms", "forearm", "wrist-flexors", "wrist-extensors"],
  glutes: ["glutes", "glute", "butt", "gluteus", "gluteus-maximus", "gluteus-medius"],
  shoulders: ["shoulders", "delts", "deltoids", "anterior-deltoid", "lateral-deltoid", "posterior-deltoid"],
  triceps: ["triceps", "triceps-brachii"],
  "upper-legs": [
    "upper legs",
    "quadriceps",
    "quads",
    "hamstrings",
    "thighs",
    "adductors",
    "abductors",
    "hip-flexors",
  ],
  "lower-legs": ["lower legs", "calves", "calf", "gastrocnemius", "soleus"],
};

// No mock list — data comes from backend APIs

export default function Exercise() {
  const navigate = useNavigate();
  const location = useLocation();

  // Thông báo trong sidebar: nội dung + tên bài tập + tổng số bài tập trong kế hoạch
  const [sidebarNotice, setSidebarNotice] = useState(() => {
    const st = location.state;
    if (st && st.toast) {
      return {
        message: st.toast,
        addedExerciseName: st.addedExerciseName || "",
        planItemCount: typeof st.planItemCount === 'number' ? st.planItemCount : undefined,
        visible: true,
      };
    }
    return { message: "", addedExerciseName: "", planItemCount: undefined, visible: false };
  });
  useEffect(() => {
    const st = location.state;
    if (st && st.toast) {
      setSidebarNotice({
        message: st.toast,
        addedExerciseName: st.addedExerciseName || "",
        planItemCount: typeof st.planItemCount === 'number' ? st.planItemCount : undefined,
        visible: true,
      });
      const t = setTimeout(() => setSidebarNotice((v) => ({ ...v, visible: false })), 10000);
      return () => clearTimeout(t);
    }
  }, [location.state]);

  // Filters state
  const muscleGroups = [
    { id: "abs", label: "Abs", icon: absIcon },
    { id: "back", label: "Back", icon: backIcon },
    { id: "biceps", label: "Biceps", icon: bicepsIcon },
    { id: "cardio", label: "Cardio", icon: cardioIcon },
    { id: "chest", label: "Chest", icon: chestIcon },
    { id: "forearms", label: "Forearms", icon: forearmsIcon },
    { id: "glutes", label: "Glutes", icon: glutesIcon },
    { id: "shoulders", label: "Shoulders", icon: shouldersIcon },
    { id: "triceps", label: "Triceps", icon: tricepsIcon },
    { id: "upper-legs", label: "Upper Legs", icon: upperLegsIcon },
    { id: "lower-legs", label: "Lower Legs", icon: lowerLegsIcon },
  ];

  const [selectedGroups, setSelectedGroups] = useState([]); // multi-select
  const [modeAll, setModeAll] = useState(true); // all vs any
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [equipment, setEquipment] = useState("");
  const [type, setType] = useState("");

  // API state
  const [rawExercises, setRawExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const [total, setTotal] = useState(0);
  const [clientPaging, setClientPaging] = useState(false);

  // Dock: "Buổi tập hôm nay" (client-only)
  const [todayList, setTodayList] = useState(() => []);
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("today_workout") || "null");
      if (Array.isArray(saved)) setTodayList(saved);
    } catch { }
  }, []);
  useEffect(() => {
    try { sessionStorage.setItem("today_workout", JSON.stringify(todayList)); } catch { }
  }, [todayList]);

  // ========== Current Plan Context (from Plan Detail) ==========
  const [currentPlan, setCurrentPlan] = useState(() => {
    try {
      const raw = sessionStorage.getItem("current_plan_context");
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (obj && obj.plan_id) return obj;
    } catch { }
    return null;
  });
  const [planItemsSet, setPlanItemsSet] = useState(new Set());
  const [planItemsCount, setPlanItemsCount] = useState(undefined);

  // Load plan items to mark membership when a current plan is active
  useEffect(() => {
    let alive = true;
    async function loadPlanItems(pid) {
      try {
        const res = await getPlanByIdApi(pid);
        // Expect res.success and res.data.items
        const list = res?.data?.items || [];
        const ids = new Set(list.map((it) => String(it.exercise?.id ?? it.exercise_id)));
        if (!alive) return;
        setPlanItemsSet(ids);
        setPlanItemsCount(list.length);
      } catch (e) {
        if (!alive) return;
        setPlanItemsSet(new Set());
        setPlanItemsCount(undefined);
      }
    }
    if (currentPlan?.plan_id) {
      loadPlanItems(currentPlan.plan_id);
    } else {
      setPlanItemsSet(new Set());
      setPlanItemsCount(undefined);
    }
    return () => { alive = false; };
  }, [currentPlan?.plan_id]);

  const clearCurrentPlan = () => {
    try { sessionStorage.removeItem("current_plan_context"); } catch { }
    setCurrentPlan(null);
    setPlanItemsSet(new Set());
    setPlanItemsCount(undefined);
  };

  const toggleGroup = (id) => {
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Fetch exercises from BE (align with demo endpoints); degrade gracefully for multi-group
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      setClientPaging(false);
      try {
        let res = null;
        const onlyGroup = selectedGroups.length === 1 ? selectedGroups[0] : null;
        if (selectedGroups.length === 0) {
          res = await api.get('/api/exercises', { params: { page, pageSize } });
          if (alive) {
            if (res.data?.success) {
              setRawExercises(res.data.data || []);
              setTotal(res.data.total ?? (res.data.data || []).length ?? 0);
            } else setError({ message: 'Không thể tải danh sách bài tập' });
          }
        } else if (onlyGroup === 'cardio') {
          res = await api.get('/api/exercises/type/cardio', { params: { page, pageSize } });
          if (alive) {
            if (res.data?.success) {
              setRawExercises(res.data.data || []);
              setTotal(res.data.total ?? (res.data.data || []).length ?? 0);
            } else setError({ message: 'Không thể tải danh sách bài tập' });
          }
        } else if (onlyGroup) {
          res = await api.get(`/api/exercises/muscle/${onlyGroup}`, { params: { page, pageSize } });
          if (alive) {
            if (res.data?.success) {
              setRawExercises(res.data.data || []);
              setTotal(res.data.total ?? (res.data.data || []).length ?? 0);
            } else setError({ message: 'Không thể tải danh sách bài tập' });
          }
        } else {
          // Multi-group: fetch by first group big page, then filter FE by the rest based on synonyms
          const base = selectedGroups[0];
          res = await api.get(`/api/exercises/muscle/${base}`, { params: { page: 1, pageSize: 1000 } });
          if (alive) {
            if (res.data?.success) {
              setClientPaging(true);
              setRawExercises(res.data.data || []);
              // total set later after FE filters
            } else setError({ message: 'Không thể tải danh sách bài tập' });
          }
        }
      } catch (e) {
        if (alive) setError({ message: e?.message || 'Lỗi kết nối đến server' });
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [selectedGroups.join(','), page, pageSize]);

  // Normalize exercises from BE shape
  const normalized = useMemo(() => {
    const list = rawExercises || [];
    return list.map((ex) => {
      const id = ex.id ?? ex.exercise_id;
      // Prefer GIF from DB when available; otherwise use whatever BE provided
      const mediaUrl = ex.gif_demo_url || ex.imageUrl || ex.thumbnail_url || '';
      const fallback = `https://picsum.photos/seed/exercise-${encodeURIComponent(id ?? Math.random().toString(36).slice(2))}/800/450`;
      return {
        id,
        name: ex.name || '',
        imageUrl: mediaUrl || fallback,
        description: ex.description || '',
        difficulty: ex.difficulty || ex.difficulty_level || '',
        impact: ex.impact_level || '',
        population: ex.population || '',
        equipment: ex.equipment || ex.equipment_needed || '',
        // For group-based FE filtering
        parts: [],
        __raw: ex,
      };
    });
  }, [rawExercises]);

  // Build filter options from data
  const optionSets = useMemo(() => {
    const levels = new Set();
    const equipments = new Set();
    const types = new Set();
    for (const ex of normalized) {
      if (ex.difficulty) levels.add(String(ex.difficulty));
      if (ex.equipment) equipments.add(String(ex.equipment));
      if (ex.__raw?.exercise_type) types.add(String(ex.__raw.exercise_type));
    }
    return {
      levels: Array.from(levels),
      equipments: Array.from(equipments),
      types: Array.from(types),
    };
  }, [normalized]);

  // FE filter for search/level/equipment/type and multi-group mode (when clientPaging or selectedGroups>1)
  const filtered = useMemo(() => {
    // text/level/equipment/type filters
    let arr = normalized.filter((ex) => {
      if (q && !normalizeStr(ex.name).includes(normalizeStr(q))) return false;
      if (level && normalizeStr(ex.difficulty) !== normalizeStr(level)) return false;
      if (equipment && normalizeStr(ex.equipment) !== normalizeStr(equipment)) return false;
      if (type && normalizeStr(ex.__raw?.exercise_type) !== normalizeStr(type)) return false;
      return true;
    });
    // multi-group FE filtering (for >1 selection)
    if (selectedGroups.length > 1) {
      const matchesOne = (ex, g) => {
        const nameNorm = normalizeStr(ex.name);
        const syns = (groupSynonyms[g] || [g]).map((s) => normalizeStr(String(s)).replace(/-/g, ' '));
        for (const s of syns) if (nameNorm.includes(s)) return true;
        return false;
      };
      arr = arr.filter((ex) => {
        if (modeAll) return selectedGroups.every((g) => matchesOne(ex, g));
        return selectedGroups.some((g) => matchesOne(ex, g));
      });
    }
    return arr;
  }, [normalized, q, level, equipment, type, selectedGroups, modeAll]);

  // Total + pagination (client vs server)
  const paged = useMemo(() => {
    if (clientPaging || selectedGroups.length > 1) {
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      return filtered.slice(start, end);
    }
    return filtered;
  }, [filtered, clientPaging, selectedGroups.length, page, pageSize]);

  useEffect(() => {
    if (clientPaging || selectedGroups.length > 1) setTotal(filtered.length);
  }, [filtered, clientPaging, selectedGroups.length]);

  const addToToday = (ex) => {
    setTodayList((prev) => (prev.find((x) => x.id === ex.id) ? prev : [...prev, ex]));
  };
  const removeFromToday = (id) => {
    setTodayList((prev) => prev.filter((x) => x.id !== id));
  };

  const addToPlan = async (ex) => {
    // If a current plan is active, add directly to that plan; otherwise go pick a plan
    if (!currentPlan?.plan_id) {
      navigate(`/plans/select?exerciseId=${encodeURIComponent(ex.id)}`, { state: { exerciseName: ex.name } });
      return;
    }
    try {
      const res = await addExerciseToPlanApi({
        planId: currentPlan.plan_id,
        exercise_id: ex.id,
        sets_recommended: 3,
        reps_recommended: "8-12",
        rest_period_seconds: 60,
      });
      // Optimistically update membership set
      setPlanItemsSet((prev) => new Set([...prev, String(ex.id)]));
      // Try to get new count from response; otherwise reload plan
      const fromRes = (() => {
        if (!res || typeof res !== 'object') return undefined;
        if (typeof res.plan_item_count === 'number') return res.plan_item_count;
        if (typeof res.items_count === 'number') return res.items_count;
        if (typeof res.total_items === 'number') return res.total_items;
        if (typeof res.total === 'number') return res.total;
        if (typeof res.count === 'number') return res.count;
        return undefined;
      })();
      let newCount = fromRes;
      if (typeof fromRes === 'number') setPlanItemsCount(fromRes);
      else {
        // Fallback: reload plan to count items
        try {
          const r = await getPlanByIdApi(currentPlan.plan_id);
          const list = r?.data?.items || [];
          newCount = list.length;
          setPlanItemsCount(newCount);
        } catch { }
      }
      // Show notice in sidebar
      setSidebarNotice({
        message: "Thêm bài tập thành công",
        addedExerciseName: ex.name || '',
        planItemCount: typeof newCount === 'number' ? newCount : (typeof planItemsCount === 'number' ? planItemsCount + 1 : undefined),
        visible: true,
      });
      // Auto-hide after 10s
      setTimeout(() => setSidebarNotice((v) => ({ ...v, visible: false })), 10000);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Không thể thêm vào kế hoạch');
    }
  };

  return (
    <div className="min-h-screen text-gray-900 bg-white">
      <HeaderLogin />

      <main className="px-4 py-6 mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-10">
          {/* Left: main content */}
          <section className="space-y-6 md:col-span-7">
            {/* Top: personalized sections (placeholders) */}
            <div className="p-4 bg-white border rounded-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tiếp tục gần đây</h2>
                <button className="text-sm text-blue-600 hover:underline" onClick={() => navigate('/dashboard')}>Xem thêm</button>
              </div>
              <p className="mt-1 text-sm text-gray-500">Gợi ý nhanh dựa trên hoạt động gần đây của bạn.</p>
            </div>

            {/* Filters */}
            <div className="p-4 bg-white border rounded-xl">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm kiếm bài tập..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Độ khó: Tất cả</option>
                    {optionSets.levels.map((lv) => (
                      <option key={lv} value={lv}>{lv}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Dụng cụ: Tất cả</option>
                    {optionSets.equipments.map((eq) => (
                      <option key={eq} value={eq}>{eq}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-group chips + mode */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <div className="mr-2 text-sm text-gray-700">Nhóm cơ:</div>
                {muscleGroups.map((g) => {
                  const active = selectedGroups.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className={`px-3 py-1.5 rounded-full border text-sm ${active ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
                <div className="flex items-center gap-2 ml-auto text-sm">
                  <span className="text-gray-600">Chế độ:</span>
                  <button
                    className={`px-2 py-1 rounded border ${modeAll ? "bg-blue-50 border-blue-600 text-blue-700" : "border-gray-300"}`}
                    onClick={() => setModeAll(true)}
                  >
                    All
                  </button>
                  <button
                    className={`px-2 py-1 rounded border ${!modeAll ? "bg-blue-50 border-blue-600 text-blue-700" : "border-gray-300"}`}
                    onClick={() => setModeAll(false)}
                  >
                    Any
                  </button>
                </div>
              </div>
            </div>

            {/* Results */}
            <div>
              <div className="mb-3 text-sm text-gray-600">Tìm thấy {total} bài tập</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {loading ? (
                  <div className="p-6 text-sm text-gray-600">Đang tải danh sách bài tập...</div>
                ) : error ? (
                  <div className="p-6 text-sm text-red-600">{error.message}</div>
                ) : paged.length === 0 ? (
                  <div className="p-6 text-sm text-gray-600">Không tìm thấy bài tập phù hợp</div>
                ) :
                  paged.map((ex) => (
                    <div key={ex.id} className="overflow-hidden bg-white border rounded-xl">
                      {ex.imageUrl ? (
                        <div className="relative w-full bg-gray-100" style={{ paddingBottom: "56%" }}>
                          <img src={ex.imageUrl} alt={ex.name} className="absolute inset-0 object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="relative w-full bg-gray-100" style={{ paddingBottom: "56%" }} />
                      )}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{ex.name}</h3>
                          <button
                            className="text-sm text-blue-600 hover:underline"
                            onClick={() => navigate(`/exercises/${ex.id}`, { state: ex })}
                          >
                            Chi tiết
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {ex.difficulty && <Badge tone="amber">{ex.difficulty}</Badge>}
                          {ex.__raw?.exercise_type && <Badge tone="purple">{ex.__raw.exercise_type}</Badge>}
                          {ex.equipment && <Badge tone="blue">{ex.equipment}</Badge>}
                          {currentPlan?.plan_id && planItemsSet.has(String(ex.id)) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded">
                              Thuộc plan {currentPlan.plan_id} - {currentPlan.name || '(Không có tên)'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => addToPlan(ex)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                          >
                            + Thêm vào Plan
                          </button>
                          <button
                            onClick={() => addToToday(ex)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            + Buổi hôm nay
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">Trang {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className={`px-3 py-2 text-sm border rounded-lg ${page <= 1 || loading ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    Trang trước
                  </button>
                  <button
                    type="button"
                    disabled={loading || page >= Math.max(1, Math.ceil(total / pageSize))}
                    onClick={() => setPage((p) => p + 1)}
                    className={`px-3 py-2 text-sm border rounded-lg ${loading || page >= Math.max(1, Math.ceil(total / pageSize)) ? 'text-gray-400 border-gray-200' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    Trang sau
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Today dock */}
          <aside className="md:col-span-3">
            <div className="sticky top-20">
              {/* Current plan context box */}
              {currentPlan?.plan_id && (
                <div className="p-3 mb-4 text-sm text-blue-900 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">Plan hiện tại: {currentPlan.plan_id} - {currentPlan.name || '(Không có tên)'}
                      </div>
                      {typeof planItemsCount === 'number' && (
                        <div className="mt-1 text-xs">Hiện có {planItemsCount} bài tập trong kế hoạch này.</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-blue-700 hover:underline"
                        onClick={() => navigate(`/plans/${currentPlan.plan_id}`)}
                      >
                        Xem
                      </button>
                      <button
                        className="text-xs text-gray-600 hover:underline"
                        onClick={() => navigate(`/plans/select`)}
                      >
                        Đổi
                      </button>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        onClick={clearCurrentPlan}
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {sidebarNotice.visible && (
                <div className="p-3 mb-4 text-sm text-white bg-green-600 rounded-lg shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">{sidebarNotice.message}</div>
                      <div className="mt-1 text-xs opacity-90">
                        {sidebarNotice.addedExerciseName ? (
                          <span>Đã thêm: <b>{sidebarNotice.addedExerciseName}</b>.</span>
                        ) : null}
                        {typeof sidebarNotice.planItemCount === 'number' ? (
                          <span> Hiện tại kế hoạch có <b>{sidebarNotice.planItemCount}</b> bài tập.</span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      className="text-white/90 hover:text-white"
                      aria-label="Đóng thông báo"
                      onClick={() => setSidebarNotice((v) => ({ ...v, visible: false }))}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              <div className="p-4 bg-white border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold">Buổi tập hôm nay</h2>
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => setTodayList([])}
                  >
                    Xoá hết
                  </button>
                </div>
                {!todayList.length ? (
                  <p className="text-sm text-gray-500">Chưa có bài tập nào. Thêm từ danh sách bên trái.</p>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-auto pr-1">
                    {todayList.map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between gap-2 p-2 border rounded-lg">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{ex.name}</div>
                          <div className="text-xs text-gray-500">{ex.equipment} • {ex.difficulty}</div>
                        </div>
                        <button
                          className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50"
                          onClick={() => removeFromToday(ex.id)}
                        >
                          Xoá
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-3">
                  {!todayList.length ? (
                    <button
                      className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-60"
                      disabled
                    >
                      Bắt đầu buổi
                    </button>
                  ) : (
                    <StartWorkoutButton exercises={todayList} />
                  )}
                </div>

              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
