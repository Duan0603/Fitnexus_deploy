import OnboardingStep from "../models/onboarding.step.model.js";
import OnboardingField from "../models/onboarding.field.model.js";
import OnboardingAnswer from "../models/onboarding.answer.model.js";
import OnboardingSession from "../models/onboarding.session.model.js";
import User from "../models/user.model.js";
import { sequelize } from "../config/database.js";
import { Op, Transaction } from "sequelize";

import { validateAnswers, pickAllowedAnswers } from "../utils/onboarding.validation.js";

/* =========================
   Helpers chung (THÊM MỚI)
   ========================= */

const ODEBUG = (process.env.ONBOARDING_DEBUG === '1') || (process.env.NODE_ENV !== 'production');
const odbg = (...args) => { if (ODEBUG) console.log('[ONBOARDING]', ...args); };

function isNonEmpty(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return true;
}

function isStepCompleteByBlob(fields, blob) {
  const reqKeys = (fields || []).filter(f => !!f.required).map(f => f.field_key);
  if (reqKeys.length === 0) return true;
  return reqKeys.every(k => isNonEmpty(blob?.[k]));
}

// Helper: fetch step by key with fields
async function getStepByKeyWithFields(stepKey) {
  const step = await OnboardingStep.findOne({
    where: { step_key: stepKey, is_active: true },
    order: [["order_index", "ASC"]],
  });
  if (!step) return null;

  const fields = await OnboardingField.findAll({
    where: { step_id: step.step_id },
    order: [["order_index", "ASC"], ["field_id", "ASC"]],
  });

  return { step, fields };
}

// Helper: find/create active session for user (concurrency-safe when provided a transaction)
async function findOrCreateActiveSession(userId, currentStepKey = null, t = null) {
  if (t) {
    // Lock the user row as a per-user mutex
    await User.findByPk(userId, { transaction: t, lock: Transaction.LOCK.UPDATE });
  }

  let session = await OnboardingSession.findOne({
    where: { user_id: userId, is_completed: false },
    order: [["created_at", "DESC"]],
    ...(t ? { transaction: t, lock: Transaction.LOCK.UPDATE } : {}),
  });

  if (!session) {
    session = await OnboardingSession.create(
      { user_id: userId, current_step_key: currentStepKey || null },
      t ? { transaction: t } : {}
    );
  }
  return session;
}

/* =========================
   GET /api/onboarding/steps/:key
   ========================= */
export async function getStep(req, res) {
  try {
    const { key } = req.params;
    const data = await getStepByKeyWithFields(key);
    if (!data) {
      return res.status(404).json({ success: false, message: "Step not found" });
    }

    const { step, fields } = data;
    return res.json({
      success: true,
      data: {
        step: {
          step_id: step.step_id,
          step_key: step.step_key,
          title: step.title,
          order_index: step.order_index,
        },
        fields: fields.map((f) => ({
          field_id: f.field_id,
          step_id: f.step_id,
          field_key: f.field_key,
          label: f.label,
          input_type: f.input_type,
          required: f.required,
          order_index: f.order_index,
          metadata: f.metadata,
        })),
      },
    });
  } catch (err) {
    console.error("getStep error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/* =========================
   POST /api/onboarding/steps/:key/answer
   Body: { answers: {...} }
   LƯU + TÍNH LẠI firstIncomplete (ĐÃ SỬA)
   ========================= */
export async function saveAnswer(req, res) {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId;
    const { key } = req.params;
    const { answers } = req.body || {};

    if (!answers || typeof answers !== "object") {
      await t.rollback();
      return res.status(400).json({ success: false, message: "answers is required" });
    }

    // Step + fields
    const data = await getStepByKeyWithFields(key);
    if (!data) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Step not found" });
    }
    const { step, fields } = data;

    // Bạn đang có rule riêng cho workout_frequency -> giữ nguyên
    if (step.step_key === "workout_frequency") {
      // 1) Chuẩn hoá kiểu về string để khớp metadata.options
      if (answers?.workout_days_per_week !== undefined) {
        answers.workout_days_per_week = String(answers.workout_days_per_week);
      }
      // 2) Validate thuộc tập options
      const field = fields.find((f) => f.field_key === "workout_days_per_week");
      const allowed = (field?.metadata?.options || []).map((o) => String(o.key));
      const chosen = String(answers?.workout_days_per_week ?? "");
      if (!chosen || !allowed.includes(chosen)) {
        await t.rollback();
        return res.status(422).json({
          success: false,
          message: "Invalid workout_days_per_week option",
        });
      }
    }

    // Chỉ pick các key hợp lệ theo field list
    const safeAnswers = pickAllowedAnswers(fields, answers);

    // Validate theo input_type/metadata bạn đã cài
    const error = validateAnswers(fields, safeAnswers);
    if (error) {
      await t.rollback();
      return res.status(422).json({ success: false, message: error });
    }

    // session hiện hành (dùng cùng transaction để tránh tạo trùng)
    const session = await findOrCreateActiveSession(userId, step.step_key, t);

    // upsert answer per (session, step)
    const existing = await OnboardingAnswer.findOne({
      where: { session_id: session.session_id, step_id: step.step_id },
      transaction: t,
      lock: Transaction.LOCK.UPDATE,
    });

    const toSave = safeAnswers;
    if (existing) {
      await existing.update({ answers: toSave }, { transaction: t });
    } else {
      await OnboardingAnswer.create(
        { session_id: session.session_id, step_id: step.step_id, answers: toSave },
        { transaction: t }
      );
    }

    /* =========================
       TÍNH LẠI firstIncomplete CHO TOÀN BỘ FLOW (SỬA)
       ========================= */
    const allSteps = await OnboardingStep.findAll({
      where: { is_active: true },
      order: [["order_index", "ASC"]],
      transaction: t,
    });
    const stepIds = allSteps.map(s => s.step_id);

    const allFields = await OnboardingField.findAll({
      where: { step_id: stepIds },
      order: [["order_index", "ASC"], ["field_id", "ASC"]],
      transaction: t,
    });
    const fieldsByStepId = new Map(stepIds.map(id => [id, []]));
    for (const f of allFields) fieldsByStepId.get(f.step_id).push(f);

    const allAnswers = await OnboardingAnswer.findAll({
      where: { session_id: session.session_id },
      transaction: t,
      lock: Transaction.LOCK.UPDATE,
    });
    const blobByStepId = new Map(allAnswers.map(a => [a.step_id, a.answers || {}]));

    // Tìm step đầu tiên còn thiếu required
    let firstIncomplete = null;
    for (const s of allSteps) {
      const sFields = fieldsByStepId.get(s.step_id) || [];
      const blob = blobByStepId.get(s.step_id) || {};
      const ok = isStepCompleteByBlob(sFields, blob);
      if (!ok) { firstIncomplete = s; break; }
    }

    const nextKey = firstIncomplete ? firstIncomplete.step_key : null;

    if (nextKey) {
      await session.update({ current_step_key: nextKey, is_completed: false, completed_at: null }, { transaction: t });
    } else {
      await session.update({ current_step_key: null, is_completed: true, completed_at: new Date() }, { transaction: t });

      // Đánh dấu user đã hoàn tất (nếu có cột này)
      const user = await User.findByPk(userId, { transaction: t });
      if (user) {
        await user.update({ onboarding_completed_at: new Date() }, { transaction: t });
      }
    }

    await t.commit();
    return res.json({
      success: true,
      message: "Saved",
      data: {
        session_id: session.session_id,
        nextStepKey: nextKey,
        completed: !nextKey,
        complete: !nextKey,
      },
    });
  } catch (err) {
    await t.rollback();
    console.error("saveAnswer error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

/* =========================
   GET /api/onboarding/session
   Trả trạng thái tổng quát (ĐÃ SỬA: luôn tính lại firstIncomplete)
   ========================= */
export async function getSessionStatus(req, res) {
  try {
    const userId = req.userId;
    odbg('getSessionStatus:start', { userId });
    const user = await User.findByPk(userId);

    const onboarded = !!(user?.onboarding_completed_at || user?.onboardingCompletedAt);
    if (onboarded) {
      return res.json({
        success: true,
        data: {
          required: false,
          completed: true,
          complete: true,
          sessionId: null,
          currentStepKey: null,
          nextStepKey: null,
          completedAt: user.onboarding_completed_at || user.onboardingCompletedAt,
        },
      });
    }

    // Tìm (hoặc tạo) session active
    let session = await OnboardingSession.findOne({
      where: { user_id: userId, is_completed: false },
      order: [["created_at", "DESC"]],
    });

    // Lấy toàn bộ steps/fields để tính firstIncomplete
    const allSteps = await OnboardingStep.findAll({
      where: { is_active: true },
      order: [["order_index", "ASC"]],
    });
    const stepIds = allSteps.map(s => s.step_id);

    const allFields = await OnboardingField.findAll({
      where: { step_id: stepIds },
      order: [["order_index", "ASC"], ["field_id", "ASC"]],
    });
    odbg('getSessionStatus:loaded', { steps: allSteps.length, fields: allFields.length, hasActiveSession: !!session });
    const fieldsByStepId = new Map(stepIds.map(id => [id, []]));
    for (const f of allFields) fieldsByStepId.get(f.step_id).push(f);

    if (!session) {
      // Nếu từng có session đã hoàn tất → coi như xong
      const completedSession = await OnboardingSession.findOne({
        where: { user_id: userId, is_completed: true },
        order: [["completed_at", "DESC"]],
      });
      if (completedSession) {
        return res.json({
          success: true,
          data: {
            required: false,
            completed: true,
            complete: true,
            sessionId: completedSession.session_id,
            currentStepKey: null,
            nextStepKey: null,
            completedAt: completedSession.completed_at,
          },
        });
      }

      // Chưa có → tạo mới một cách an toàn (khóa theo user để tránh tạo trùng)
      await sequelize.transaction(async (t) => {
        // per-user mutex
        await User.findByPk(userId, { transaction: t, lock: Transaction.LOCK.UPDATE });
        const existing = await OnboardingSession.findOne({
          where: { user_id: userId, is_completed: false },
          order: [["created_at", "DESC"]],
          transaction: t,
          lock: Transaction.LOCK.UPDATE,
        });
        if (existing) {
          session = existing;
        } else {
          session = await OnboardingSession.create(
            {
              user_id: userId,
              current_step_key: allSteps.length ? allSteps[0].step_key : null,
            },
            { transaction: t }
          );
        }
      });
    }

    // Đọc các câu trả lời đã lưu cho session này
    const saved = await OnboardingAnswer.findAll({
      where: { session_id: session.session_id },
    });
    odbg('getSessionStatus:answers', { answers: saved.length });
    const blobByStepId = new Map(saved.map(a => [a.step_id, a.answers || {}]));

    // Tính firstIncomplete
    let firstIncomplete = null;
    for (const s of allSteps) {
      const sFields = fieldsByStepId.get(s.step_id) || [];
      const blob = blobByStepId.get(s.step_id) || {};
      if (!isStepCompleteByBlob(sFields, blob)) { firstIncomplete = s; break; }
    }

    const nextKey = firstIncomplete ? firstIncomplete.step_key : null;

    // Đồng bộ session nếu lệch
    if (nextKey) {
      if (session.current_step_key !== nextKey || session.is_completed) {
        await session.update({ current_step_key: nextKey, is_completed: false, completed_at: null });
      }
      odbg('getSessionStatus:pending', { nextKey });
      return res.json({
        success: true,
        data: {
          required: true,
          completed: false,
          complete: false,
          sessionId: session.session_id,
          currentStepKey: nextKey,
          nextStepKey: nextKey,
          completedAt: null,
        },
      });
    } else {
      // Không còn bước dở → đánh dấu hoàn tất
      if (!session.is_completed || session.current_step_key !== null) {
        await session.update({ is_completed: true, completed_at: new Date(), current_step_key: null });
      }
      // Đánh dấu user đã hoàn tất (nếu muốn đồng bộ tại đây)
      if (!user?.onboarding_completed_at && !user?.onboardingCompletedAt) {
        const u = await User.findByPk(userId);
        if (u) await u.update({ onboarding_completed_at: new Date() });
      }

      odbg('getSessionStatus:completed', { sessionId: session.session_id });
      return res.json({
        success: true,
        data: {
          required: false,
          completed: true,
          complete: true,
          sessionId: session.session_id,
          currentStepKey: null,
          nextStepKey: null,
          completedAt: session.completed_at || new Date(),
        },
      });
    }
  } catch (err) {
    console.error("getSessionStatus error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
