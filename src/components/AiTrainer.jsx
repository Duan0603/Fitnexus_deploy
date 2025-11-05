import React, { useState, useRef } from 'react';
import api from '../lib/api.js';
import HeaderLogin from './header/HeaderLogin.jsx';
import { useNavigate } from 'react-router-dom';
import { createPlanApi, addExerciseToPlanApi } from '../lib/api.js';

const AiTrainer = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [heightCm, setHeightCm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [planCreateMsg, setPlanCreateMsg] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // Giới hạn 10MB
        setError("Kích thước ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setAnalysisResult(null);
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Vui lòng chọn một file ảnh.");
      return;
    }
    setIsLoading(true);
    setError("");
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append("image", selectedFile);
    if (heightCm) {
      formData.append("known_height_cm", String(heightCm));
    }

    try {
      const response = await api.post(`/api/trainer/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data && response.data.success) {
        setAnalysisResult(response.data.data);
      } else {
        throw new Error("Phản hồi từ server không hợp lệ.");
      }
    } catch (err) {
      // Specific handling for quota exceeded error
      if (err.response?.status === 429 && err.response?.data?.code === 'AI_QUOTA_EXCEEDED') {
        const userWantsToUpgrade = window.confirm(
          "Bạn đã hết lượt sử dụng miễn phí hôm nay. Bạn có muốn nâng cấp lên Premium không?"
        );
        if (userWantsToUpgrade) {
          navigate("/pricing");
        }
        setError("Bạn đã hết lượt dùng miễn phí trong ngày.");
      } else {
        // Generic error handling for other issues
        const serverError =
          err.response?.data?.errors?.[0]?.details ||
          err.response?.data?.message ||
          err.message;
        setError(`Đã có lỗi xảy ra: ${serverError}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewImage(null);
    setAnalysisResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Create Plan from AI suggestions ---
  const normalize = (s = "") => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const extractExercise = (line) => {
    if (!line) return { name: null, sets: null, reps: null };
    let name = String(line);
    if (name.includes(':')) name = name.split(':')[0];
    if (name.includes('-')) name = name.split('-')[0];
    name = name.replace(/\(.*?\)/g, '').trim();
    const setsMatch = line.match(/(\d+)\s*x\s*\d+|(\d+)\s*sets?/i);
    const repsMatch = line.match(/x\s*(\d+)|reps?\s*:?\s*(\d+(?:-\d+)?)/i);
    let sets = null;
    if (setsMatch) sets = parseInt(setsMatch[1] || setsMatch[2], 10) || null;
    let reps = null;
    if (repsMatch) reps = repsMatch[1] || repsMatch[2] || null;
    return { name: name.trim(), sets, reps };
  };

  const findBestExerciseId = (targetName, catalog) => {
    if (!targetName) return null;
    const t = normalize(targetName);
    let best = null;
    let bestScore = 0;
    for (const ex of catalog) {
      const n = normalize(ex.name || ex.name_en || "");
      if (!n) continue;
      let score = 0;
      if (n === t) score = 100;
      else if (n.includes(t)) score = 90;
      else if (t.includes(n)) score = 80;
      else {
        const ts = new Set(t.split(/\s+/));
        const ns = new Set(n.split(/\s+/));
        let overlap = 0;
        ts.forEach((w) => { if (ns.has(w)) overlap += 1; });
        score = overlap;
      }
      if (score > bestScore) { bestScore = score; best = ex; }
      if (bestScore >= 100) break;
    }
    return best ? best.id || best.exercise_id : null;
  };

  const handleCreatePlanFromAI = async () => {
    try {
      setIsCreatingPlan(true);
      setPlanCreateMsg("");
      const analysis = analysisResult?.analysis_data;
      if (!analysis) throw new Error('Thiếu dữ liệu phân tích để tạo plan.');

      const planName = `AI Plan - ${new Date().toLocaleDateString()}`;
      const description = `${analysis.title || 'Plan từ AI'}${analysis.shape_type ? ' | ' + analysis.shape_type : ''}`;
      const planRes = await createPlanApi({ name: planName, description, difficulty_level: 'beginner', is_public: false });
      const planId = planRes?.data?.plan_id || planRes?.plan_id || planRes?.data?.plan?.plan_id;
      if (!planId) throw new Error('Không lấy được plan_id sau khi tạo plan.');

      const catalogRes = await api.get('/api/exercises', { params: { page: 1, pageSize: 1000 } });
      const catalog = catalogRes?.data?.data || [];

      const lines = Array.isArray(analysis.exercises) ? analysis.exercises : [];
      let order = 1;
      for (const line of lines) {
        const { name, sets, reps } = extractExercise(line);
        if (!name) continue;
        const exId = findBestExerciseId(name, catalog);
        if (!exId) continue;
        try {
          await addExerciseToPlanApi({ planId, exercise_id: exId, session_order: order, sets_recommended: sets, reps_recommended: reps });
          order += 1;
        } catch (_) { }
      }

      setPlanCreateMsg('Đã tạo plan từ gợi ý.');
      navigate(`/plans/${planId}`);
    } catch (e) {
      setPlanCreateMsg(`Không thể tạo plan: ${e.message}`);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  return (
    <div>
      <HeaderLogin />
      <div className="w-full p-4 mx-auto max-w-7xl sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-300 sm:text-5xl">
            Fitnexus - AI Trainer
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Tải ảnh toàn thân để phân tích chỉ số cơ thể (hiển thị cm)
          </p>
        </header>

        {/* Upload Section */}
        <main>
          <div className="max-w-3xl p-6 mx-auto mb-10 bg-white border shadow-lg rounded-2xl border-rose-200">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center gap-4"
            >
              <label
                htmlFor="file-upload"
                className="w-full px-6 py-3 font-bold text-center transition-colors duration-300 border-2 border-dashed cursor-pointer rounded-xl border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              >
                {selectedFile
                  ? "Ảnh đã được chọn!"
                  : "Nhấn vào đây để chọn ảnh"}
              </label>
              <input
                id="file-upload"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              {selectedFile && (
                <p className="text-sm font-semibold text-rose-700">
                  {selectedFile.name}
                </p>
              )}
              <div className="flex items-center w-full gap-3">
                <label
                  htmlFor="height-cm"
                  className="text-sm font-semibold text-rose-700 whitespace-nowrap"
                >
                  Chiều cao (cm, bắt buộc)
                </label>
                <input
                  id="height-cm"
                  type="number"
                  min="100"
                  max="230"
                  step="0.1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="VD: 175"
                  required
                  className="flex-1 px-3 py-2 bg-white border rounded-md outline-none text-rose-700 placeholder-slate-400 border-rose-300 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-4 mt-2">
                <button
                  type="submit"
                  className="px-8 py-2 font-bold text-white transition-transform duration-200 rounded-lg bg-rose-500 hover:bg-rose-600 hover:scale-105 disabled:bg-rose-200 disabled:cursor-not-allowed disabled:scale-100"
                  disabled={isLoading || !selectedFile || !heightCm}
                >
                  {isLoading ? "Đang xử lý..." : "Phân tích"}
                </button>
                {selectedFile && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-8 py-2 font-bold text-white transition-transform duration-200 bg-blue-500 rounded-lg hover:bg-blue-600 hover:scale-105"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
            {error && (
              <p className="mt-4 font-semibold text-rose-600">{error}</p>
            )}
          </div>

          {/* Results Section */}
          {(isLoading || analysisResult) && (
            <div className="grid grid-cols-1 gap-8 mt-10 lg:grid-cols-2">
              {/* Original Image */}
              <div className="p-6 bg-white border border-blue-100 shadow-lg rounded-2xl">
                <h3 className="mb-4 text-2xl font-extrabold text-rose-600">
                  Ảnh gốc
                </h3>
                {previewImage && (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="rounded-lg shadow"
                  />
                )}
              </div>

              {/* Processed Image & Analysis */}
              <div className="p-6 bg-white border border-blue-100 shadow-lg rounded-2xl">
                <h3 className="mb-4 text-2xl font-extrabold text-rose-600">
                  Kết quả phân tích
                </h3>
                {isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-16 h-16 border-8 rounded-full border-rose-200 border-t-rose-500 animate-spin"></div>
                  </div>
                )}
                {analysisResult && (
                  <div className="space-y-6">
                    <img
                      src={analysisResult.processed_image_url}
                      alt="Processed"
                      className="mb-2 rounded-lg shadow"
                    />
                    {/* Metrics & Assessment first */}
                    <MetricsPanel
                      analysisResult={analysisResult}
                      heightCm={heightCm}
                    />

                    {/* Textual analysis and exercise suggestions combined */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {/* Textual analysis */}
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                        <h4 className="mb-2 text-lg font-extrabold text-rose-600">Phân tích chi tiết</h4>
                        {analysisResult.analysis_data?.body_type && (
                          <p className="mb-1"><strong className="text-rose-700">Dáng:</strong> {analysisResult.analysis_data.body_type}</p>
                        )}
                        {analysisResult.analysis_data?.body_analysis && (
                          <p className="mb-2 text-slate-700 whitespace-pre-line">{analysisResult.analysis_data.body_analysis}</p>
                        )}
                        {analysisResult.analysis_data?.nutrition_advice && (
                          <p className="mb-1"><strong className="text-blue-700">Dinh dưỡng:</strong> {analysisResult.analysis_data.nutrition_advice}</p>
                        )}
                        {analysisResult.analysis_data?.lifestyle_tips && (
                          <p className="mb-1"><strong className="text-blue-700">Lối sống:</strong> {analysisResult.analysis_data.lifestyle_tips}</p>
                        )}
                        {analysisResult.analysis_data?.estimated_timeline && (
                          <p className="mb-1"><strong className="text-blue-700">Lộ trình ước tính:</strong> {analysisResult.analysis_data.estimated_timeline}</p>
                        )}
                        {analysisResult.analysis_data?.advice && (
                          <p className="mt-2"><strong className="text-blue-700">Lời khuyên:</strong> {analysisResult.analysis_data.advice}</p>
                        )}
                      </div>

                      {/* Exercise suggestions + create plan */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="mb-2 text-lg font-extrabold text-blue-700">Đề xuất bài tập</h4>
                        {Array.isArray(analysisResult.analysis_data?.exercises) && analysisResult.analysis_data.exercises.length > 0 ? (
                          <ul className="mb-3 space-y-1 list-disc list-inside text-slate-800">
                            {analysisResult.analysis_data.exercises.map((ex, i) => (
                              <li key={i}>{ex}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mb-3 text-slate-700">Chưa có danh sách bài tập gợi ý.</p>
                        )}
                        <button
                          type="button"
                          onClick={handleCreatePlanFromAI}
                          disabled={isCreatingPlan}
                          className="px-5 py-2 font-semibold text-white rounded-lg bg-rose-500 hover:bg-rose-600 disabled:bg-rose-200"
                        >
                          {isCreatingPlan ? 'Đang tạo plan...' : 'Tạo plan từ gợi ý'}
                        </button>
                        {planCreateMsg && (
                          <p className="mt-2 text-sm text-rose-700">{planCreateMsg}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AiTrainer;

// --- Subcomponents ---
function MetricsPanel({ analysisResult, heightCm }) {
  const m = analysisResult?.measurements || {};
  const px = m.pixel_measurements || {};
  const cm = m.cm_measurements || {};
  const apiScale = m?.scale_cm_per_px != null ? Number(m.scale_cm_per_px) : null;
  const derivedScale = (!apiScale && heightCm && px.height) ? Number(heightCm) / Number(px.height) : null;
  const scale = apiScale || derivedScale || null;

  const fmt = (key) => {
    if (cm && cm[key] != null) return `${Number(cm[key]).toFixed(1)} cm`;
    if (scale && px[key] != null) return `${(Number(px[key]) * Number(scale)).toFixed(1)} cm`;
    if (px[key] != null) return `${Number(px[key]).toFixed(1)} px`;
    return "—";
  };

  const ratio = (key) => {
    const v = px[key];
    if (v == null) return "—";
    return Number(v).toFixed(2);
  };

  // Extra derived ratio
  const legToHeight = (() => {
    const l = px.leg_length,
      h = px.height;
    if (l && h && h > 0) return (l / h).toFixed(2);
    return "—";
  })();

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h4 className="mb-3 text-lg font-extrabold text-rose-600">
        Chỉ số cơ thể
      </h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Metric label="Shoulder width" value={fmt("shoulder_width")} />
        <Metric label="Waist width" value={fmt("waist_width")} />
        <Metric label="Hip width" value={fmt("hip_width")} />
        <Metric label="Height estimate" value={fmt("height")} />
        <Metric label="Leg length" value={fmt("leg_length")} />
        <Metric
          label="Shoulder/Hip ratio"
          value={ratio("shoulder_hip_ratio")}
        />
        <Metric label="Waist/Hip ratio" value={ratio("waist_hip_ratio")} />
        <Metric label="Leg/Height ratio" value={legToHeight} />
      </div>
      {(analysisResult.analysis_data?.shape_type ||
        analysisResult.analysis_data?.somatotype) && (
        <div className="pt-3 mt-3 border-t border-rose-200">
          {analysisResult.analysis_data.shape_type && (
            <p className="font-semibold text-rose-700">
              <strong className="text-rose-700">Kiểu hình:</strong>{" "}
              {analysisResult.analysis_data.shape_type}
            </p>
          )}
          {analysisResult.analysis_data.somatotype && (
            <p className="font-semibold text-blue-700">
              <strong className="text-blue-700">Cơ địa:</strong>{" "}
              {analysisResult.analysis_data.somatotype}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-white border border-blue-100 rounded-md">
      <span className="text-sm font-semibold text-rose-700">{label}</span>
      <span className="font-bold text-blue-700">{value}</span>
    </div>
  );
}
