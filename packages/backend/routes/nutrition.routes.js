import express from 'express';
import jwt from 'jsonwebtoken';
import authOrSession from '../middleware/authOrSession.guard.js';
import OnboardingSession from '../models/onboarding.session.model.js';
import OnboardingAnswer from '../models/onboarding.answer.model.js';
import OnboardingStep from '../models/onboarding.step.model.js';
import User from '../models/user.model.js';
import aiQuota from '../middleware/ai.quota.js';

const router = express.Router();

const GDEBUG = (process.env.GEMINI_DEBUG === '1') || (process.env.NODE_ENV !== 'production');
const dbg = (...args) => { if (GDEBUG) console.log('[GEMINI]', ...args); };

function isNutritionRelated(text = '') {
  const s = String(text || '').toLowerCase();
  if (!s.trim()) return true;
const allow = [
  // --- GỐC BẠN CÓ ---
  'ăn','dinh dưỡng','calo','kcal','protein','carb','fat','lipid','bữa','khẩu phần',
  'giảm cân','tăng cân','giữ cân','giảm mỡ','tăng cơ','macro','meal','diet','nutrition','plan',
  'thực đơn','ăn kiêng','keto','low carb','high protein','bữa sáng','bữa trưa','bữa tối','snack',
  'thức ăn','thực phẩm','healthy','eat clean','organic','vitamin','khoáng chất',
  'fitness','gym','body fat','bmi','bmr','tdee',
  'detox','plant-based','vegan','vegetarian','gluten-free','dairy-free',
  'dị ứng','di ung','intolerance','đường huyết','tiểu đường','tim mạch','cholesterol cao',
  'tính calo','phân tích dinh dưỡng','ai dinh dưỡng','tư vấn dinh dưỡng','meal recommendation',

  // --- MỞ RỘNG MACRO/MICRO/CHỈ SỐ ---
  'đạm','tinh bột','chất béo','chất xơ','đường','đường added','đường tự nhiên',
  'omega-3','omega 3','omega-6','omega 6','cholesterol','hdl','ldl','triglyceride',
  'glycemic index','gi','glycemic load','gl','satiety index','mật độ năng lượng','caloric density',
  'micronutrient','micros','macros','macro split','p:c:f','tỉ lệ p c f','tỷ lệ p c f',

  // --- VITAMIN/KHOÁNG ---
  'vitamin a','vitamin b','vitamin c','vitamin d','vitamin e','vitamin k',
  'canxi','calcium','sắt','iron','kẽm','zinc','magie','magnesium','iod','iodine','folate','axit folic',

  // --- ĐO LƯỜNG/ĐƠN VỊ ---
  'calories','calorie','maintenance calories','calorie deficit','calorie surplus',
  'ước tính calo','đếm calo','tính macro','macro calculator','calorie calculator',
  'serving','servings','serving size','portion','portion size','khẩu phần ăn','suất',
  'per 100g','trên 100g','100g',
  'g/kg','gram per kg','grams per kg','protein per kg',

  // --- CHẾ ĐỘ ĂN/Diets ---
  'low fat','ít béo','low sugar','ít đường','ít muối','không đường',
  'paleo','mediterranean','địa trung hải','dash','whole30','carnivore',
  'lactose-free','không lactose','casein-free','soy-free','không đậu nành',
  'intermittent fasting','if','nhịn ăn gián đoạn','omad','5:2','16:8','18:6','20:4','eat stop eat','alternate day fasting',
  'clean eating','meal plan','meal planner','mealplan','meal-prep','meal prep','meal prepping',

  // --- BỐI CẢNH BỮA ĂN/TẬP LUYỆN ---
  'ăn nhẹ','ăn vặt','pre-workout','post-workout','trước khi tập','sau khi tập',
  'nạp carb','carb cycling','chu kỳ carb','refeed','cheat day','cheat meal',
  'bulk','bulking','cut','cutting','recomp','lean bulk','dirty bulk','reverse diet',

  // --- THỨC UỐNG/HYDRATION ---
  'hydration','uống nước','nước lọc','nước tăng lực','energy drink','isotonic','electrolyte','bù điện giải',
  'nước ngọt','đồ uống có đường','soda',

  // --- TÌNH TRẠNG SỨC KHỎE ---
  'tiểu đường tuýp 2','tiểu đường tuýp 1','hạ đường huyết','mỡ máu','gan nhiễm mỡ',
  'gout','dạ dày','viêm dạ dày','trào ngược','pcos','hội chứng buồng trứng đa nang',
  'cường giáp','suy giáp','tuyến giáp','huyết áp cao','béo phì',

  // --- DỊ ỨNG/LOẠI TRỪ ---
  'dị ứng sữa','dị ứng đậu phộng','dị ứng lạc','peanut allergy','tree nut','hạt cây',
  'hải sản','shellfish','tôm','cua','nhuyễn thể','gluten','lactose','casein','đậu nành','trứng','wheat','mè','sesame',

  // --- NHÃN DINH DƯỠNG/FACTS ---
  'nutrition facts','nhãn dinh dưỡng','bảng dinh dưỡng','thành phần dinh dưỡng','nutrition label',

  // --- THỰC PHẨM “CƠ BẢN” HAY HỎI CALO ---
  'trứng','lòng trắng trứng','yogurt','sữa chua','sữa tách béo','sữa ít béo',
  'ức gà','chicken breast','thịt bò nạc','lean beef','cá hồi','salmon','cá ngừ','tuna','tôm','shrimp',
  'yến mạch','oat','oats','oatmeal','gạo lứt','brown rice','khoai lang','sweet potato','bánh mì','bread',
  'đậu hũ','tofu','tempeh','đậu xanh','đậu đỏ','đậu đen','hạt chia','chia seed','yến mạch qua đêm','overnight oats',

  // --- CÁCH CHẾ BIẾN (ảnh hưởng chỉ số) ---
  'hấp','luộc','nướng','chiên','rán','áp chảo','airfryer','nồi chiên không dầu','xào',

  // --- THỰC PHẨM BỔ SUNG/SUPPS ---
  'whey','casein','protein powder','mass gainer','bcaa','eaa','creatine','fish oil','omega 3','multivitamin','collagen',
  'preworkout','caffeine','beta alanine','l-carnitine','green tea extract','electrolyte powder',

  // --- PHƯƠNG PHÁP TÍNH/CT ---
  'harris-benedict','mifflin st jeor','mifflin-st jeor','mifflin-st-jeor','lean body mass','lbm',

  // --- CÂU HỎI MẪU HAY GÕ ---
  'bao nhiêu calo','bao nhieu calo','calo của','calo cua','nhiệt lượng','nang luong',
  'ăn bao nhiêu','an bao nhieu','ăn mấy bữa','an may bua','gợi ý khẩu phần','goi y khau phan',
  'thực đơn 7 ngày','thực đơn 1 tuần','thuc don 7 ngay','thuc don 1 tuan'
];
  return allow.some(k => s.includes(k));
}

async function callGemini(prompt, apiKey) {
  if (!apiKey) {
    dbg('missing apiKey → demo response');
    return 'Bản nháp kế hoạch (demo, thiếu GEMINI_API_KEY)\n\n- Mục tiêu: theo yêu cầu\n- Bữa sáng/trưa/tối + snack: gợi ý mẫu\n- Macro ước tính theo mục tiêu\n\nHãy cấu hình GEMINI_API_KEY ở backend để nhận đề xuất chi tiết từ AI.';
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  const temp = Number.isFinite(+process.env.GEMINI_TEMPERATURE) ? +process.env.GEMINI_TEMPERATURE : 0.7;
  const maxTok = Number.isFinite(+process.env.GEMINI_MAX_TOKENS) ? +process.env.GEMINI_MAX_TOKENS : 2048;
  const topP = Number.isFinite(+process.env.GEMINI_TOP_P) ? +process.env.GEMINI_TOP_P : undefined;
  const topK = Number.isFinite(+process.env.GEMINI_TOP_K) ? +process.env.GEMINI_TOP_K : undefined;
  dbg('model in use', { model, temp, maxTok, ...(topP!=null?{topP}:{}) , ...(topK!=null?{topK}:{}) });
  const versions = ['v1', 'v1beta'];
  const genCfg = { temperature: temp, maxOutputTokens: maxTok };
  if (topP != null) genCfg.topP = topP;
  if (topK != null) genCfg.topK = topK;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: genCfg,
    safetySettings: [],
  };

  const postJson = async (fullUrl, payloadObj) => {
    const payload = JSON.stringify(payloadObj);
    if (typeof fetch === 'function') {
      const r = await fetch(fullUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
      const txt = await r.text();
      let json = {};
      try { json = JSON.parse(txt); } catch {}
      if (!r.ok) {
        const msg = json?.error?.message || `Gemini API error ${r.status}`;
        const err = new Error(msg);
        err.status = r.status; err.body = json; err.url = fullUrl;
        throw err;
      }
      return json;
    }
    // Node < 18 fallback
    const https = await import('https');
    const { URL } = await import('url');
    const u = new URL(fullUrl);
    const options = { method: 'POST', hostname: u.hostname, path: u.pathname + u.search, headers: { 'Content-Type': 'application/json' } };
    const data = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let chunks = '';
        res.on('data', (d) => (chunks += d));
        res.on('end', () => { try { resolve(JSON.parse(chunks)); } catch (e) { reject(e); } });
      });
      req.on('error', reject); req.write(JSON.stringify(payloadObj)); req.end();
    });
    if (data?.error) { const err = new Error(data.error.message || 'Gemini API error'); err.status = data.error.code; err.body = data; throw err; }
    return data;
  };

  let lastErr = null;
  for (const v of versions) {
    const url = `https://generativelanguage.googleapis.com/${v}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    try {
      dbg('request', { version: v, model, promptLen: String(prompt).length });
      const data = await postJson(url, body);
      const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
      dbg('success', { version: v, model, textLen: text.length });
      return text;
    } catch (e) {
      dbg('error', { version: v, model, status: e?.status, message: e?.message });
      lastErr = e;
      if (e?.status !== 404) break; // only fallback to next version on 404
    }
  }
  throw lastErr || new Error('Gemini API call failed');
}

router.post('/plan', aiQuota('nutrition_plan'), async (req, res) => {
  try {
    const goalRaw = String(req.body?.goal || '').toUpperCase();
    const extra = String(req.body?.extra || '').trim();
    const allowed = ['LOSE_WEIGHT','GAIN_WEIGHT','MAINTAIN'];
    const goal = allowed.includes(goalRaw) ? goalRaw : 'MAINTAIN';
    if (!isNutritionRelated(extra)) {
      dbg('off-topic blocked', { goal: goalRaw, extraLen: extra.length });
      return res.status(400).json({ success: false, offTopic: true, message: 'Tôi chỉ được thiết kế để lên kế hoạch dinh dưỡng' });
    }
    // Try enrich with onboarding if caller has a valid token
    let prompt = '';
    let usedProfile = null;
    let usingOnboarding = false;
    try {
      const header = req.get('authorization') || req.get('Authorization') || '';
      const [scheme, token] = header.split(' ');
      if (scheme === 'Bearer' && token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload?.sub || payload?.userId || payload?.id || null;
        if (userId) {
          dbg('plan:try-onboarding', { userId });
          try {
            const r = await buildPromptFromOnboarding(userId, extra);
            prompt = r.prompt;
            usedProfile = r.profile;
            usingOnboarding = true;
          } catch (e) {
            dbg('plan:onboarding-skip', { reason: e?.message });
          }
        }
      }
    } catch (e) {
      dbg('plan:jwt-parse-error', { message: e?.message });
    }

    // Fallback: minimal goal-only prompt
    if (!prompt) {
      const goalText = goal === 'LOSE_WEIGHT' ? 'giảm cân' : goal === 'GAIN_WEIGHT' ? 'tăng cân' : 'giữ cân đối';
      prompt = `Cung cấp cho tôi menu ăn uống trong 1 tuần với Mục tiêu: ${goalText}${extra ? ` + lưu ý: ${extra}` : ''}`;
    }
    dbg('prompt', { usingOnboarding, promptLen: prompt.length });
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    dbg('incoming', { goal: goalRaw, extraLen: extra.length, model: process.env.GEMINI_MODEL || 'gemini-2.0-flash', apiKeySet: !!apiKey });
    const resp = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { text: resp, ...(usingOnboarding ? { usedProfile } : {}) } });
  } catch (err) {
    console.error('nutrition plan error:', err);
    // Graceful fallback so FE still gets a plan
    const fallback = `Kế hoạch (fallback do lỗi gọi AI)\n\n- Mục tiêu: ${String(req.body?.goal || '')}\n- Gợi ý: ăn cân bằng, ưu tiên thực phẩm tươi, tránh đồ siêu chế biến.\n- Bữa sáng/trưa/tối kèm snack tuỳ ngân sách.\n\n(Thiết lập GEMINI_API_KEY và đảm bảo model hợp lệ để nhận gợi ý chi tiết từ AI.)`;
    dbg('fallback-used', { message: err?.message });
    return res.json({ success: true, data: { text: fallback }, meta: { fallback: true, error: err?.message || 'unknown' } });
  }
});

// Build a structured prompt from onboarding answers
async function buildPromptFromOnboarding(userId, extraText = '') {
  dbg('onboarding:buildPrompt:start', { userId });
  const user = await User.findByPk(userId);

  // Prefer the latest completed session; fall back to the latest created
  let session = await OnboardingSession.findOne({
    where: { user_id: userId, is_completed: true },
    order: [["completed_at", "DESC"]],
  });
  if (!session) {
    session = await OnboardingSession.findOne({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
  }
  if (!session) {
    const err = new Error('No onboarding session found');
    err.status = 400;
    throw err;
  }
  dbg('onboarding:session', { sessionId: session.session_id, completed: !!session.is_completed, completed_at: session.completed_at, created_at: session.created_at });

  const answers = await OnboardingAnswer.findAll({
    where: { session_id: session.session_id },
    include: [{ model: OnboardingStep, as: 'step', attributes: ['step_key'] }],
    order: [["created_at", "ASC"]],
  });
  dbg('onboarding:answers:loaded', { count: answers.length, steps: answers.map(a => a?.step?.step_key).filter(Boolean) });

  const byStep = {};
  for (const a of answers) {
    const key = a?.step?.step_key;
    if (key) byStep[key] = a.answers || {};
  }

  const pick = (stepKey, field) => (byStep?.[stepKey] ? byStep[stepKey][field] : undefined);

  const goalRaw = pick('goal', 'goal');
  const bodyTypeRaw = pick('body_type', 'body_type');
  const bodyFatRaw = pick('level_body_fat', 'body_fat_level');
  const expLevelRaw = pick('experience_level', 'experience_level');
  const ageGroupRaw = pick('age', 'age_group');
  const heightCm = Number(pick('height', 'height_cm')) || null;
  const weightKg = Number(pick('weight', 'weight_kg')) || null;
  const wpf = pick('workout_frequency', 'workout_days_per_week');
  const workoutDays = wpf != null ? Number(wpf) : null;

  const toLabel = {
    goal: (g) => ({ LOSE_FAT: 'giảm mỡ', BUILD_MUSCLE: 'tăng cơ', MAINTAIN: 'duy trì' }[String(g || '').toUpperCase()] || null),
    bodyType: (v) => ({ SKINNY: 'gầy', NORMAL: 'bình thường', OVERWEIGHT: 'thừa cân', MUSCULAR: 'cơ bắp' }[String(v || '').toUpperCase()] || null),
    bodyFat: (v) => ({ VERY_LOW: 'rất thấp', LOW: 'thấp', NORMAL: 'bình thường', HIGH: 'cao' }[String(v || '').toUpperCase()] || null),
    exp: (v) => ({ BEGINNER: 'mới bắt đầu', INTERMEDIATE: 'trung cấp', ADVANCED: 'nâng cao' }[String(v || '').toUpperCase()] || null),
    ageGroup: (v) => ({ AGE_16_29: '16–29', AGE_30_39: '30–39', AGE_40_49: '40–49', AGE_50_PLUS: '50+' }[String(v || '').toUpperCase()] || null),
    gender: (v) => ({ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' }[String(v || '').toUpperCase()] || null),
  };

  const genderRaw = user?.gender || null;
  const profile = {
    goal: goalRaw || null,
    goal_label: toLabel.goal(goalRaw),
    age_group: ageGroupRaw || null,
    age_group_label: toLabel.ageGroup(ageGroupRaw),
    gender: genderRaw || null,
    gender_label: toLabel.gender(genderRaw),
    height_cm: heightCm,
    weight_kg: weightKg,
    body_type: bodyTypeRaw || null,
    body_type_label: toLabel.bodyType(bodyTypeRaw),
    body_fat_level: bodyFatRaw || null,
    body_fat_label: toLabel.bodyFat(bodyFatRaw),
    experience_level: expLevelRaw || null,
    experience_label: toLabel.exp(expLevelRaw),
    workout_days_per_week: workoutDays,
  };

  let bmi = null;
  if (profile.height_cm && profile.weight_kg) {
    const m = profile.height_cm / 100;
    bmi = +(profile.weight_kg / (m * m)).toFixed(1);
  }
  dbg('onboarding:profile', {
    goal: profile.goal,
    height_cm: profile.height_cm,
    weight_kg: profile.weight_kg,
    bmi,
    body_type: profile.body_type,
    body_fat_level: profile.body_fat_level,
    experience_level: profile.experience_level,
    workout_days_per_week: profile.workout_days_per_week,
  });

  // Build a concise, structured prompt for Gemini
  const lines = [];
  const goalTxt = profile.goal_label || 'cá nhân hoá dinh dưỡng';
  lines.push(`Hãy đóng vai chuyên gia dinh dưỡng và đề xuất kế hoạch ăn uống phù hợp cho mục tiêu: ${goalTxt}.`);
  lines.push('Dưới đây là hồ sơ người dùng:');
  if (profile.age_group_label) lines.push(`- Độ tuổi: ${profile.age_group_label}`);
  if (profile.gender_label) lines.push(`- Giới tính: ${profile.gender_label}`);
  if (profile.height_cm) lines.push(`- Chiều cao: ${profile.height_cm} cm`);
  if (profile.weight_kg) lines.push(`- Cân nặng: ${profile.weight_kg} kg`);
  if (bmi) lines.push(`- BMI: ${bmi}`);
  if (profile.body_type_label) lines.push(`- Thể trạng: ${profile.body_type_label}`);
  if (profile.body_fat_label) lines.push(`- Mỡ cơ thể: ${profile.body_fat_label}`);
  if (profile.experience_label) lines.push(`- Kinh nghiệm tập luyện: ${profile.experience_label}`);
  if (profile.workout_days_per_week != null) lines.push(`- Số buổi tập/tuần: ${profile.workout_days_per_week}`);
  if (extraText && isNutritionRelated(extraText)) lines.push(`- Ràng buộc/ưu tiên thêm: ${extraText.trim()}`);

  lines.push('Yêu cầu phản hồi:');
  lines.push('- Tính/ước lượng tổng calo khuyến nghị mỗi ngày (nêu rõ giả định).');
  lines.push('- Đề xuất phân bổ macro (protein/carb/fat) theo gram mỗi ngày.');
  lines.push('- Gợi ý thực đơn mẫu 1–3 ngày theo bữa (sáng/trưa/tối + snack) với khẩu phần gần đúng.');
  lines.push('- Nếu có dị ứng/ưu tiên, điều chỉnh món cho phù hợp.');
  lines.push('- Trình bày ngắn gọn, có bullet, đơn vị quen thuộc (g, ml, kcal).');

  const finalPrompt = lines.join('\n');
  dbg('onboarding:prompt:ready', { length: finalPrompt.length });
  return { prompt: finalPrompt, profile, bmi };
}

// New: generate plan using latest onboarding answers of the authenticated user
router.post('/plan/from-onboarding', authOrSession, aiQuota('nutrition_plan'), async (req, res) => {
  try {
    const extra = String(req.body?.extra || '').trim();
    const { prompt, profile } = await buildPromptFromOnboarding(req.userId, extra);
    dbg('prompt[from-onboarding]', { userId: req.userId, promptLen: prompt.length });
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    const text = await callGemini(prompt, apiKey);
    return res.json({ success: true, data: { text, usedProfile: profile } });
  } catch (err) {
    console.error('nutrition plan from onboarding error:', err);
    const safe = (m) => (typeof m === 'string' && m.trim() ? m.trim() : 'Không xác định');
    let extra = '';
    try {
      const { profile } = await buildPromptFromOnboarding(req.userId).catch(() => ({ profile: {} }));
      extra = `\n\nHồ sơ tóm tắt: mục tiêu=${safe(profile?.goal_label)}, cân nặng=${safe(profile?.weight_kg)}kg, chiều cao=${safe(profile?.height_cm)}cm.`;
    } catch (_) {}
    const fallback = `Kế hoạch (fallback do lỗi gọi AI)${extra}\n- Gợi ý: ăn cân bằng, ưu tiên thực phẩm tươi, tránh đồ siêu chế biến.\n- Bữa sáng/trưa/tối kèm snack, khẩu phần vừa đủ.\n(Thiết lập GEMINI_API_KEY và đảm bảo model hợp lệ để nhận gợi ý chi tiết.)`;
    return res.json({ success: true, data: { text: fallback }, meta: { fallback: true, error: err?.message || 'unknown' } });
  }
});

export default router;
