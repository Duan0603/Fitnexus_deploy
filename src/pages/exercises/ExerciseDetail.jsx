// src/pages/exercises/ExerciseDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { favoriteExercise, unfavoriteExercise, getExerciseFavoriteStatus } from '../../lib/api.js';
import { Heart } from 'lucide-react';
import { useAuth } from "../../context/auth.context.jsx";

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}

export default function ExerciseDetail() {
  const { id: idOrSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ---- State
  const [exerciseRaw, setExerciseRaw] = useState(location.state || null);
  const [images, setImages] = useState([]); // từ bảng image_exercise
  const [steps, setSteps] = useState([]); // từ exercise_step.json hoặc API steps
  const [related, setRelated] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [muscles, setMuscles] = useState(null);
  const [musclesLoading, setMusclesLoading] = useState(false);
  const [loading, setLoading] = useState(!location.state);
  const [error, setError] = useState(null);

  const [mainMedia, setMainMedia] = useState(null); // url ảnh/gif đang hiển thị
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  // Scroll to top when switching exercise
  useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch {}
  }, [idOrSlug]);

  // Sync when navigating to a new id/slug: prefer location.state if it matches (by id or slug)
  useEffect(() => {
    const state = location.state;
    const want = String(idOrSlug || "");
    const currentKey = String(
      exerciseRaw?.exercise_id ?? exerciseRaw?.id ?? exerciseRaw?.slug ?? ""
    );

    if (state) {
      const sId = state?.exercise_id ?? state?.id;
      const sSlug = state?.slug;
      const match = [sId, sSlug].some(
        (v) => v != null && String(v) === want
      );
      if (match) {
        setExerciseRaw(state);
        setImages([]);
        setSteps([]);
        setError(null);
        setLoading(false);
        return;
      }
    }

    if (currentKey && currentKey !== want) {
      // different item: reset to trigger fetch
      setExerciseRaw(null);
      setImages([]);
      setSteps([]);
      setError(null);
      setLoading(true);
    }
  }, [idOrSlug, location.state]);

  // ---- Chuẩn hóa dữ liệu theo model bạn đã đưa
  const exercise = useMemo(() => {
    if (!exerciseRaw) return null;
    const e = exerciseRaw;

    // chấp nhận cả hai kiểu key: id hoặc exercise_id
    const exercise_id = e.exercise_id ?? e.id ?? e.exerciseId;
    const name = e.name || e.title || "Bài tập";
    const difficulty = e.difficulty_level ?? e.difficulty ?? null;
    const equipment = e.equipment_needed ?? e.equipment ?? null;
    const type = e.exercise_type ?? e.type ?? null;
    const gif = e.gif_demo_url ?? e.gifUrl ?? e.gif_url ?? null;
    const thumb = e.thumbnail_url ?? e.imageUrl ?? null;

    // nhóm cơ (có thể backend trả về theo nhiều tên khác nhau)
    const primaryMuscles =
      e.primary_muscles ??
      e.primaryMuscleGroups ??
      e.primary_groups ??
      e.primary ??
      []; // array of strings

    const secondaryMuscles =
      e.secondary_muscles ??
      e.secondaryMuscleGroups ??
      e.secondary_groups ??
      e.secondary ??
      []; // array of strings

    return {
      exercise_id,
      name,
      name_en: e.name_en ?? null,
      slug: e.slug ?? String(exercise_id),
      description: e.description ?? null,
      difficulty,
      equipment,
      type,
      gif,
      thumb,
      primaryMuscles,
      secondaryMuscles,
      primary_video_url: e.primary_video_url ?? null,
    };
  }, [exerciseRaw]);

  useEffect(() => {
    // Only skip fetch if current in-memory item matches route param
    if (exerciseRaw) {
      const key = String(
        exerciseRaw.exercise_id ?? exerciseRaw.id ?? exerciseRaw.slug ?? ""
      );
      if (key === String(idOrSlug)) return;
    }
    let alive = true;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        // BE chưa có endpoint chi tiết cho phần này -> lấy list rồi them theo id/slug
        const list = await axios.get("/api/exercises", {
          params: { t: Date.now(), page: 1, pageSize: 1000 },
        });
        if (alive && list.data?.success) {
          const found = (list.data.data || []).find(
            (e) =>
              String(e.exercise_id ?? e.id) === String(idOrSlug) ||
              String(e.slug) === String(idOrSlug)
          );
          if (found) {
            setExerciseRaw(found);
          } else {
            setError("Không tìm thấy bài tập");
          }
        } else if (alive) {
          setError("Không thể tải thông tin bài tập");
        }
      } catch (err) {
        if (alive) setError(err.message || "Lỗi tải dữ liệu");
      } finally {
        if (alive) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      alive = false;
    };
  }, [idOrSlug]);

  useEffect(() => {
    if (!exercise) return;
    let alive = true;

    async function fetchExtra() {
      try {
        const stepRes =
          (await axios
            .get(`/api/exercises/id/${exercise.exercise_id}/steps`)
            .catch(() => null)) ||
          (exercise.slug
            ? await axios
                .get(
                  `/api/exercises/slug/${encodeURIComponent(
                    exercise.slug
                  )}/steps`
                )
                .catch(() => null)
            : null) ||
          (await axios
            .get(`/data/exercise_steps/${exercise.slug}.json`)
            .catch(() => null)) ||
          (await axios
            .get(`/data/exercise_steps/${exercise.exercise_id}.json`)
            .catch(() => null));

        if (alive && stepRes?.data) {
          const payload =
            stepRes.data.data ?? stepRes.data.steps ?? stepRes.data;
          const arr = Array.isArray(payload) ? payload : [];
          setSteps(arr);
        }
      } catch {
  
      }
      // fetch favorite status/count
      try {
        const favRes = await getExerciseFavoriteStatus(exercise.exercise_id).catch(() => null);
        if (alive && favRes?.data) {
          setFavorited(!!favRes.data.favorited);
          setFavoriteCount(Number(favRes.data.favorite_count || 0));
        }
      } catch (e) {
        // ignore
      }
    }
    fetchExtra();
  }, [exercise]);

  useEffect(() => {
    if (!exercise?.exercise_id) return;
    let alive = true;
    (async () => {
      try {
        setRelatedLoading(true);
        const res = await axios.get(
          `/api/exercises/id/${exercise.exercise_id}/related`,
          { params: { limit: 16 } }
        );
        if (alive && res?.data?.success) {
          setRelated(res.data.data || []);
        }
      } catch {
      } finally {
        if (alive) setRelatedLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [exercise?.exercise_id]);

  // Fetch muscles breakdown with percentages
  useEffect(() => {
    if (!exercise?.exercise_id) return;
    let alive = true;
    (async () => {
      try {
        setMusclesLoading(true);
        const res = await axios.get(`/api/exercises/id/${exercise.exercise_id}/muscles`);
        if (alive && res?.data?.success) setMuscles(res.data.data || null);
      } catch {}
      finally { if (alive) setMusclesLoading(false); }
    })();
    return () => { alive = false; }
  }, [exercise?.exercise_id]);

  useEffect(() => {
    if (!exercise) return;
    const firstImage = images?.[0]?.url || images?.[0]?.image_url || null;
    const initial = exercise.gif || exercise.thumb || firstImage || null;
    setMainMedia(initial);
  }, [exercise, images]);

  const handleAddToPlan = () => {
    if (!exercise?.exercise_id) return;
    const picker = `/plans/select?exerciseId=${encodeURIComponent(
      exercise.exercise_id
    )}`;
    if (user) navigate(picker);
    else navigate("/login", { state: { from: picker } });
  };

  return (
    <div key={String(idOrSlug)} className="max-w-6xl px-4 py-6 mx-auto">
      <button
        type="button"
        onClick={() => navigate("/exercises")}
        className="mb-4 text-blue-600 hover:underline"
      >
        Về Exercise
      </button>

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Quay lại
      </button>

      {loading && (
        <div className="space-y-3">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-6 md:grid-cols-10">
            <div className="space-y-3 md:col-span-3">
              <div className="h-56 bg-gray-100 rounded animate-pulse" />
              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3 md:col-span-7">
              <div className="flex justify-between">
                <div className="w-64 h-8 bg-gray-100 rounded animate-pulse" />
                <div className="bg-gray-100 rounded h-9 w-36 animate-pulse" />
              </div>
              <div className="h-5 bg-gray-100 rounded w-80 animate-pulse" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-full h-4 bg-gray-100 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !loading && <div className="text-red-600">{error}</div>}

      {exercise && !loading && !error && (
        <div className="grid gap-6 md:grid-cols-10">
          <aside className="md:col-span-3">
            <div className="p-2 bg-white border rounded-lg">
              {mainMedia ? (
                <img
                  src={mainMedia}
                  alt={exercise.name}
                  className="object-cover w-full h-56 rounded"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-56 text-gray-400 bg-gray-100 rounded">
                  Không có media
                </div>
              )}
            </div>

            {/* Gallery */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                exercise.gif,
                exercise.thumb,
                ...images.map((x) => x.url || x.image_url),
              ]
                .filter(Boolean)
                .map((url, idx) => (
                  <button
                    key={`${url}-${idx}`}
                    type="button"
                    onClick={() => setMainMedia(url)}
                    className={`rounded border p-0.5 transition ${
                      mainMedia === url
                        ? "border-blue-400 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`media-${idx}`}
                      className="object-cover w-full h-16 rounded"
                    />
                  </button>
                ))}
            </div>
          </aside>

          <section className="md:col-span-7">
            <div className="p-5 bg-white border rounded-lg shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {exercise.name}
                  </h1>
                  {exercise.name_en && (
                    <p className="text-sm text-gray-500">{exercise.name_en}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToPlan}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  + Thêm vào Plan
                </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!user) return navigate('/login', { state: { from: `/exercises/${exercise.slug}` } });
                      try {
                        if (!favorited) {
                          const r = await favoriteExercise(exercise.exercise_id);
                          setFavorited(true);
                          setFavoriteCount(Number(r.data.favorite_count || favoriteCount + 1));
                        } else {
                          const r = await unfavoriteExercise(exercise.exercise_id);
                          setFavorited(false);
                          setFavoriteCount(Number(r.data.favorite_count || Math.max(0, favoriteCount - 1)));
                        }
                      } catch (e) {
                        alert(e?.response?.data?.message || 'Lỗi xử lý yêu thích');
                      }
                    }}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg ${favorited ? 'bg-red-50 text-red-600 border border-red-200' : 'text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${favorited ? 'text-red-600' : 'text-gray-500'}`} />
                    {favorited ? 'Đã yêu thích' : 'Yêu thích'} ({favoriteCount})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                {exercise.difficulty && (
                  <Badge tone="amber">Độ khó: {exercise.difficulty}</Badge>
                )}
                {exercise.type && (
                  <Badge tone="purple">Loại: {exercise.type}</Badge>
                )}
                {exercise.equipment && (
                  <Badge tone="blue">Dụng cụ: {exercise.equipment}</Badge>
                )}
              </div>

              <div className="grid gap-3 mb-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-sm font-medium text-gray-800">Chính</h3>
                  {!musclesLoading && muscles?.primary?.items?.length ? (
                    <ul className="space-y-2">
                      {muscles.primary.items.map((m) => (
                        <li key={m.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-800">
                              {m.parent?.name ? `${m.parent.name} • ${m.name}` : m.name}
                            </span>
                            <span className="ml-2 text-gray-600">{m.percent}%</span>
                          </div>
                          <div className="w-full h-2 mt-1 bg-blue-100 rounded">
                            <div className="h-2 bg-blue-500 rounded" style={{ width: `${Math.max(0, Math.min(100, m.percent || 0))}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : musclesLoading ? (
                    <p className="text-sm text-gray-500">Đang tải...</p>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-medium text-gray-800">Phụ</h3>
                  {!musclesLoading && muscles?.secondary?.items?.length ? (
                    <ul className="space-y-2">
                      {muscles.secondary.items.map((m) => (
                        <li key={m.id} className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-800">
                              {m.parent?.name ? `${m.parent.name} • ${m.name}` : m.name}
                            </span>
                            <span className="ml-2 text-gray-600">{m.percent}%</span>
                          </div>
                          <div className="w-full h-2 mt-1 bg-green-100 rounded">
                            <div className="h-2 bg-green-500 rounded" style={{ width: `${Math.max(0, Math.min(100, m.percent || 0))}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : musclesLoading ? (
                    <p className="text-sm text-gray-500">Đang tải...</p>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
              </div>

              {exercise.description && (
                <div className="prose-sm prose max-w-none">
                  <h3 className="mb-1 text-sm font-medium text-gray-800">
                    Mô tả
                  </h3>
                  <p className="text-gray-700">{exercise.description}</p>
                </div>
              )}

              <div className="mt-5">
                <h3 className="mb-2 text-sm font-medium text-gray-800">
                  Hướng dẫn từng bước
                </h3>
                {steps?.length ? (
                  <ol className="space-y-2">
                    {steps.map((s, i) => (
                      <li
                        key={i}
                        className="p-3 text-sm text-gray-800 border border-gray-100 rounded-md bg-gray-50"
                      >
                        <span className="mr-2 font-medium text-gray-600">
                          Bước {i + 1}:
                        </span>
                        {typeof s === "string"
                          ? s
                          : s.instruction_text || s.text || JSON.stringify(s)}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa có hướng dẫn chi tiết.
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
      {/* Related scroller */}
      {!!related?.length && (
        <div className="p-5 mt-6 bg-white border rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              Bài tập liên quan
            </h3>
          </div>
          <div className="flex gap-4 pb-2 overflow-x-auto">
            {related.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() =>
                  navigate(
                    `/exercises/${encodeURIComponent(ex.id)}`,
                    { state: ex }
                  )
                }
                className="flex-shrink-0 w-56 text-left transition border rounded-lg hover:shadow-sm"
              >
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="object-cover w-full rounded-t-lg h-36"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full text-gray-400 rounded-t-lg h-36 bg-gray-50">
                    No Image
                  </div>
                )}
                <div className="p-3">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">
                    {ex.name}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ex.difficulty && (
                      <Badge tone="amber">{ex.difficulty}</Badge>
                    )}
                    {ex.equipment && <Badge tone="blue">{ex.equipment}</Badge>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
