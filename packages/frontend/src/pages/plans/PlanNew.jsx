import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/auth.context.jsx";
import { createPlanApi, addExerciseToPlanApi } from "../../lib/api.js";
import logo from "../../assets/logo.png";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function PlanNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedExerciseId = useMemo(() => {
    const v = parseInt(searchParams.get("exerciseId"), 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }, [searchParams]);

  const defaultName = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `Kế hoạch luyện tập - ${dd}/${mm}/${yyyy}`;
  }, []);

  const [form, setForm] = useState({
    name: defaultName,
    description: "",
    difficulty_level: "",
    is_public: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [createdPlan, setCreatedPlan] = useState(null);

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? !!checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: String(form.name || "").trim(),
        description: String(form.description || "").trim() || undefined,
        difficulty_level: form.difficulty_level || undefined,
        is_public: !!form.is_public,
      };
      if (!payload.name) {
        setSaving(false);
        setError({ message: "Vui lòng nhập tên kế hoạch" });
        return;
      }
      const res = await createPlanApi(payload);
      if (!res?.success) throw new Error(res?.message || "Tạo plan thất bại");
      const plan = res.data;
      setCreatedPlan(plan);

      // Auto-add preselected exercise if any
      if (preselectedExerciseId) {
        try {
          await addExerciseToPlanApi({
            planId: plan.plan_id,
            exercise_id: preselectedExerciseId,
            session_order: 1,
            sets_recommended: 3,
            reps_recommended: "8-12",
            rest_period_seconds: 60,
          });
        } catch (_) {
          // ignore auto-add error, user can add manually later
        }
      }

      // Điều hướng tùy chọn: tới trang plan chi tiết (chưa có) hoặc dashboard
      // navigate(`/plans/${plan.plan_id}`);
    } catch (err) {
      setError({
        message:
          err?.response?.data?.message || err?.message || "Tạo plan thất bại",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <HeaderLogin/>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl px-4 py-10 mx-auto">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            Tạo kế hoạch luyện tập
          </h1>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">
              {error.message}
            </div>
          )}

          {!createdPlan ? (
            <form
              onSubmit={onSubmit}
              className="p-6 bg-white border shadow-sm rounded-xl"
            >
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Tên kế hoạch
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="VD: Full Body – 20/10/2025"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={3}
                  placeholder="Mục tiêu, nhóm cơ ưu tiên, lưu ý..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Cấp độ
                  </label>
                  <select
                    name="difficulty_level"
                    value={form.difficulty_level}
                    onChange={onChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Không chọn</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={form.is_public}
                      onChange={onChange}
                    />
                    <span className="text-sm text-gray-700">
                      Cho phép công khai (tùy chọn)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-black bg-gray-300 rounded-lg hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Đang tạo..." : "Tạo kế hoạch"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 bg-white border shadow-sm rounded-xl">
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Đã tạo kế hoạch thành công
              </h2>
              <div className="mb-4 text-sm text-gray-600">
                <div>
                  Tên: <b>{createdPlan.name}</b>
                </div>
                {preselectedExerciseId ? (
                  <div>
                    Đã thêm bài tập ID: <b>{preselectedExerciseId}</b> vào kế
                    hoạch.
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard`)}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Về Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/exercises`)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Thêm bài tập khác
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
