import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlanByIdApi, updatePlanApi } from "../../lib/api.js";
import HeaderLogin from "../../components/header/HeaderLogin.jsx";

export default function PlanEdit() {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [form, setForm] = useState({
    name: "",
    description: "",
    difficulty_level: "",
    is_public: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      setLoading(true);
      try {
        const res = await getPlanByIdApi(planId);
        if (res.success) {
          const { name, description, difficulty_level, is_public } = res.data.plan;
          setForm({
            name: name || "",
            description: description || "",
            difficulty_level: difficulty_level || "",
            is_public: is_public || false,
          });
        } else {
          setError("Không tìm thấy kế hoạch.");
        }
      } catch (err) {
        setError("Lỗi khi tải dữ liệu kế hoạch.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [planId]);

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
        description: String(form.description || "").trim() || null,
        difficulty_level: form.difficulty_level || null, // Gửi null thay vì undefined
        is_public: !!form.is_public,
      };
      if (!payload.name) {
        setError({ message: "Vui lòng nhập tên kế hoạch" });
        setSaving(false);
        return;
      }
      const res = await updatePlanApi(planId, payload);
      if (!res?.success) throw new Error(res?.message || "Cập nhật thất bại");
      navigate("/plans/manage"); // Redirect to management page on success
    } catch (err) {
      setError({ message: err?.response?.data?.message || err?.message || "Cập nhật thất bại" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div>
      <HeaderLogin />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl px-4 py-10 mx-auto">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Chỉnh sửa Kế hoạch</h1>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">
              {error.message || error}
            </div>
          )}

          <form onSubmit={onSubmit} className="p-6 bg-white border shadow-sm rounded-xl">
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Tên kế hoạch</label>
              <input name="name" value={form.name} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>

            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium text-gray-700">Mô tả</label>
              <textarea name="description" value={form.description} onChange={onChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Cấp độ</label>
                <select name="difficulty_level" value={form.difficulty_level} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Không chọn</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" name="is_public" checked={form.is_public} onChange={onChange} />
                  <span className="text-sm text-gray-700">Công khai</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button type="submit" disabled={saving} className="px-5 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
              <button type="button" onClick={() => navigate("/plans/manage")} className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}