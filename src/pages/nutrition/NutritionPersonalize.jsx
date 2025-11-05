import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { endpoints } from '../../lib/api.js';
import './NutritionAI.css';
import Navbar from '../../components/common/Navbar.jsx';
import { useAuth } from '../../context/auth.context.jsx';
import { renderMarkdown } from '../../lib/markdown.js';

const GOALS = [
  { key: 'LOSE_WEIGHT', label: 'Giảm cân' },
  { key: 'GAIN_WEIGHT', label: 'Tăng cân' },
  { key: 'MAINTAIN', label: 'Giữ cân/balanced' },
];

export default function NutritionPersonalize() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [goal, setGoal] = useState('LOSE_WEIGHT');
  const [extra, setExtra] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plan, setPlan] = useState('');

  const disabled = useMemo(() => !goal || loading, [goal, loading]);

  const submit = async () => {
    try {
      setLoading(true); setError(null); setPlan('');
      const res = await api.post(endpoints.nutrition.plan, { goal, extra });
      const data = res?.data?.data || res?.data || {};
      if (data.offTopic) {
        setError('Tôi chỉ được thiết kế để lên kế hoạch dinh dưỡng');
        return;
      }
      const text = data.text || data.plan || data.response || '';
      setPlan(String(text || 'Không có nội dung.'));
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Không thể tạo kế hoạch dinh dưỡng';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="fc-page">
        <Navbar />
        <div className="fc-container">
          {/* Page header card (under the fixed navbar) */}
          
          <div className="fc-card">
            <div className="fc-header">
              <h3>Cá nhân hoá chế độ dinh dưỡng</h3>
              <p className="fc-sub">Chọn mục tiêu và mô tả ngắn gọn để AI gợi ý kế hoạch ăn uống.</p>
            </div>

            <div className="fc-grid">
              <div className="fc-col">
                <label className="fc-label">Mục tiêu</label>
                <div style={{ display: 'grid', gap: 10 }}>
                  {GOALS.map(g => (
                    <button
                      key={g.key}
                      type="button"
                      className={`fc-btn-secondary ${goal === g.key ? 'active' : ''}`}
                      onClick={() => setGoal(g.key)}
                      aria-pressed={goal === g.key}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="fc-col">
                <label className="fc-label">Thông tin bổ sung (tuỳ chọn)</label>
                <textarea
                  className="fc-input"
                  rows={6}
                  placeholder="Ví dụ: dị ứng tôm, ăn chay, không ăn tối sau 8h, ngân sách 100k/ngày, 4 bữa/ngày…"
                  value={extra}
                  onChange={(e) => setExtra(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button className="fc-btn-primary" disabled={disabled} onClick={submit}>
                    Tạo kế hoạch
                  </button>
                  <button className="fc-btn-secondary" onClick={() => navigate('/nutrition-ai')}>Quay lại Nutrition AI</button>
                </div>
                {loading && <div className="fc-loading" style={{ marginTop: 10 }}>Đang tạo kế hoạch…</div>}
                {error && <div className="fc-error" style={{ marginTop: 10 }}>{error}</div>}
              </div>
            </div>
          </div>

          {plan && (
            <div className="fc-card" style={{ marginTop: 18 }}>
              <div className="fc-header">
                <h3>Kế hoạch gợi ý</h3>
              </div>
              <div
                className="markdown-body"
                style={{ lineHeight: 1.6, maxHeight: '70vh', overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(plan) }}
              />
            </div>
          )}
        </div>
      </div>
  );
}
