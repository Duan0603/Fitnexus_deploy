import WorkoutSession from "../models/workout.session.model.js";
import WorkoutSessionExercise from "../models/workout.session.exercise.model.js";
import WorkoutSessionSet from "../models/workout.session.set.model.js";
import Exercise from "../models/exercise.model.js";
import WorkoutPlan from "../models/workout.plan.model.js";
import { Op } from "sequelize";
import {sequelize} from "../config/database.js";
import PlanExerciseDetail from "../models/plan.exercise.detail.model.js";


export async function getActiveSession(req, res) {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        // Tìm session đang in_progress hoặc paused
        const session = await WorkoutSession.findOne({
            where: {
                user_id: userId,
                status: {
                    [Op.in]: ['in_progress', 'paused']
                }
            },
            order: [['started_at', 'DESC']], // Lấy session gần nhất
            include: [
                {
                    model: WorkoutPlan,
                    as: 'plan',
                    attributes: ['plan_id', 'name', 'description'],
                    required: false, // LEFT JOIN - vì plan có thể null
                }
            ],
        });

        // Nếu không có session active
        if (!session) {
            return res.status(200).json({
                success: true,
                data: null, // Không có session đang dở
                message: "No active session found"
            });
        }

        // Có session active → lấy chi tiết exercises và sets
        const exercises = await WorkoutSessionExercise.findAll({
            where: { session_id: session.session_id },
            order: [['session_order', 'ASC']],
            include: [
                {
                    model: Exercise,
                    as: 'exercise',
                    attributes: [
                        'exercise_id',
                        'name',
                        'difficulty_level',
                        'equipment_needed',
                        'thumbnail_url',
                        'gif_demo_url',
                    ],
                },
                {
                    model: WorkoutSessionSet,
                    as: 'sets',
                    order: [['set_index', 'ASC']],
                    required: false, // LEFT JOIN - exercise có thể chưa có set nào
                }
            ],
        });

        // Format response - Summary cho Resume/Restart decision
        const responseData = {
            session: {
                session_id: session.session_id,
                plan_id: session.plan_id,
                plan_name: session.plan?.name || null,
                status: session.status,
                started_at: session.started_at,
                updated_at: session.updated_at, // Để tính "Lần cuối tập: X giờ trước"
                current_exercise_index: session.current_exercise_index,
                exercises_count: exercises.length,
                notes: session.notes,
            },
            exercises: exercises.map(ex => ({
                session_exercise_id: ex.session_exercise_id,
                exercise_id: ex.exercise_id,
                session_order: ex.session_order,
                target_sets: ex.target_sets,
                target_reps: ex.target_reps,
                target_rest_seconds: ex.target_rest_seconds,
                completed_sets: ex.completed_sets,
                status: ex.status,
                exercise: {
                    exercise_id: ex.exercise?.exercise_id,
                    name: ex.exercise?.name,
                    difficulty_level: ex.exercise?.difficulty_level,
                    equipment_needed: ex.exercise?.equipment_needed,
                    image_url: ex.exercise?.thumbnail_url || ex.exercise?.gif_demo_url,
                },
                sets: (ex.sets || []).map(set => ({
                    set_id: set.set_id,
                    set_index: set.set_index,
                    actual_reps: set.actual_reps,
                    actual_weight_kg: set.actual_weight_kg,
                    rest_seconds: set.rest_seconds,
                    completed_at: set.completed_at,
                    notes: set.notes,
                })),
            })),
            summary: {
                total_exercises: exercises.length,
                completed_exercises: exercises.filter(ex => ex.status === 'completed').length,
                current_exercise: exercises[session.current_exercise_index] || null,
            }
        };

        return res.status(200).json({
            success: true,
            data: responseData,
        });

    } catch (err) {
        console.error("getActiveSession error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
}

export async function createWorkoutSession(req, res) {
  const t = await sequelize.transaction();
  
  try {
    const userId = req.userId;
    if (!userId) {
      await t.rollback();
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized" 
      });
    }

    const planId = parseInt(req.body?.plan_id, 10);
    const notes = req.body?.notes ? String(req.body.notes).trim() : null;

    if (!Number.isFinite(planId) || planId <= 0) {
      await t.rollback();
      return res.status(422).json({ 
        success: false, 
        message: "plan_id is required and must be a valid number" 
      });
    }

    // ============ 1. KIỂM TRA SESSION ACTIVE ============
    const existingActive = await WorkoutSession.findOne({
      where: {
        user_id: userId,
        status: {
          [Op.in]: ['in_progress', 'paused']
        }
      },
      attributes: ['session_id', 'plan_id', 'status', 'started_at', 'current_exercise_index'],
      include: [{
        model: WorkoutPlan,
        as: 'plan',
        attributes: ['name'],
        required: false
      }],
      transaction: t
    });

    if (existingActive) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: "You already have an active workout session",
        data: {
          session_id: existingActive.session_id,
          plan_id: existingActive.plan_id,
          plan_name: existingActive.plan?.name || null,
          status: existingActive.status,
          started_at: existingActive.started_at,
          current_exercise_index: existingActive.current_exercise_index,
          actions: ['resume', 'complete', 'cancel']
        }
      });
    }

    // ============ 2. KIỂM TRA QUYỀN TRUY CẬP PLAN ============
    const plan = await WorkoutPlan.findOne({
      where: { plan_id: planId },
      attributes: ['plan_id', 'name', 'creator_id', 'is_public'],
      transaction: t
    });

    if (!plan) {
      await t.rollback();
      return res.status(404).json({ 
        success: false, 
        message: "Plan not found" 
      });
    }

    // Check quyền: phải là creator hoặc plan public
    const hasAccess = plan.creator_id === userId || plan.is_public === true;
    if (!hasAccess) {
      await t.rollback();
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to use this plan" 
      });
    }

    // ============ 3. SNAPSHOT EXERCISES TỪ PLAN ============
    const planExercises = await PlanExerciseDetail.findAll({
      where: { plan_id: planId },
      order: [
        ['session_order', 'ASC'],
        ['plan_exercise_id', 'ASC']
      ],
      attributes: [
        'plan_exercise_id',
        'exercise_id',
        'session_order',
        'sets_recommended',
        'reps_recommended',
        'rest_period_seconds'
      ],
      transaction: t
    });

    // Chuẩn hóa session_order: gán dải tuần tự 1..N
    // để tránh null/duplicate khi insert vào workout_session_exercises
    const normalizedExercises = planExercises.map((ex, index) => ({
      plan_exercise_id: ex.plan_exercise_id,
      exercise_id: ex.exercise_id,
      session_order: index + 1, // 1, 2, 3, ...
      target_sets: ex.sets_recommended,
      target_reps: ex.reps_recommended,
      target_rest_seconds: ex.rest_period_seconds
    }));

    // Edge case: Plan không có exercise
    // Product decision: Vẫn cho tạo session để user có thể thêm exercise sau
    // Nếu muốn block, uncomment dưới:
    // if (normalizedExercises.length === 0) {
    //   await t.rollback();
    //   return res.status(422).json({ 
    //     success: false, 
    //     message: "Plan has no exercises" 
    //   });
    // }

    // ============ 4. TẠO SESSION (TRANSACTION) ============
    const session = await WorkoutSession.create({
      user_id: userId,
      plan_id: planId,
      status: 'in_progress',
      started_at: new Date(),
      current_exercise_index: 0,
      notes: notes
    }, { transaction: t });

    // ============ 5. BULK INSERT SESSION EXERCISES ============
    const sessionExercises = normalizedExercises.map(ex => ({
      session_id: session.session_id,
      plan_exercise_id: ex.plan_exercise_id,
      exercise_id: ex.exercise_id,
      session_order: ex.session_order,
      target_sets: ex.target_sets,
      target_reps: ex.target_reps,
      target_rest_seconds: ex.target_rest_seconds,
      completed_sets: 0,
      status: 'pending' // Hoặc set exercise đầu tiên = 'in_progress'
    }));

    // Optional: Set exercise đầu tiên là 'in_progress'
    if (sessionExercises.length > 0) {
      sessionExercises[0].status = 'in_progress';
    }

    await WorkoutSessionExercise.bulkCreate(sessionExercises, { 
      transaction: t 
    });

    // ============ 6. COMMIT & RESPONSE ============
    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Workout session created successfully",
      data: {
        session_id: session.session_id,
        plan_id: plan.plan_id,
        plan_name: plan.name,
        exercises_count: sessionExercises.length,
        status: session.status,
        started_at: session.started_at,
        current_exercise_index: session.current_exercise_index
      }
    });

  } catch (err) {
    await t.rollback();
    console.error("createWorkoutSession error:", err);

    // Handle unique constraint violation (race condition)
    if (err.name === 'SequelizeUniqueConstraintError' || 
        err.message?.includes('ws_one_active_per_user_idx')) {
      return res.status(409).json({
        success: false,
        message: "You already have an active workout session. Please complete or cancel it first."
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: err.message 
    });
  }
}

// ========== RUN MODE: CURRENT EXERCISE ==========
export async function getCurrentExercise(req, res) {
  try {
    const userId = req.userId;
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!Number.isFinite(sessionId) || sessionId <= 0) return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });

    const session = await WorkoutSession.findOne({ where: { session_id: sessionId, user_id: userId } });
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });

    const idx = Number(session.current_exercise_index) || 0;

    const ex = await WorkoutSessionExercise.findOne({
      where: { session_id: sessionId, session_order: idx + 1 },
      include: [
        { model: Exercise, as: 'exercise', attributes: ['exercise_id','name','description','difficulty_level','equipment_needed','thumbnail_url','gif_demo_url'] }
      ]
    });
    const total = await WorkoutSessionExercise.count({ where: { session_id: sessionId } });

    if (!ex) {
      return res.status(200).json({
        success: true,
        data: {
          session: { session_id: session.session_id, plan_id: session.plan_id, status: session.status, current_exercise_index: idx },
          exercise: null,
          is_done: true,
          total_exercises: total,
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session: { session_id: session.session_id, plan_id: session.plan_id, status: session.status, current_exercise_index: idx },
        exercise: {
          session_exercise_id: ex.session_exercise_id,
          exercise_id: ex.exercise_id,
          name: ex.exercise?.name,
          description: ex.exercise?.description,
          image_url: ex.exercise?.thumbnail_url || ex.exercise?.gif_demo_url || null,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_rest_seconds: ex.target_rest_seconds,
          status: ex.status,
        },
        is_done: false,
        total_exercises: total,
      }
    });
  } catch (err) {
    console.error('getCurrentExercise error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

export async function completeCurrentExercise(req, res) {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId;
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!userId) { await t.rollback(); return res.status(401).json({ success: false, message: 'Unauthorized' }); }
    if (!Number.isFinite(sessionId) || sessionId <= 0) { await t.rollback(); return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' }); }

    const session = await WorkoutSession.findOne({ where: { session_id: sessionId, user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!session) { await t.rollback(); return res.status(404).json({ success: false, message: 'Session không tồn tại' }); }
    if (!['in_progress','paused'].includes(session.status)) { await t.rollback(); return res.status(409).json({ success: false, message: 'Session không ở trạng thái đang tập' }); }

    const idx = Number(session.current_exercise_index) || 0;
    const curr = await WorkoutSessionExercise.findOne({ where: { session_id: sessionId, session_order: idx + 1 }, transaction: t, lock: t.LOCK.UPDATE });
    if (!curr) {
      await t.commit();
      return res.status(200).json({ success: true, data: { done: true } });
    }

    await WorkoutSessionExercise.update({ status: 'completed' }, { where: { session_exercise_id: curr.session_exercise_id }, transaction: t });

    const total = await WorkoutSessionExercise.count({ where: { session_id: sessionId }, transaction: t });
    const nextIdx = Math.min(idx + 1, Math.max(0, total));
    await WorkoutSession.update({ current_exercise_index: nextIdx, status: 'in_progress' }, { where: { session_id: sessionId }, transaction: t });

    await t.commit();
    return res.status(200).json({ success: true, data: { next_index: nextIdx, total } });
  } catch (err) {
    await t.rollback();
    console.error('completeCurrentExercise error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

export async function skipCurrentExercise(req, res) {
  const t = await sequelize.transaction();
  try {
    const userId = req.userId;
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!userId) { await t.rollback(); return res.status(401).json({ success: false, message: 'Unauthorized' }); }
    if (!Number.isFinite(sessionId) || sessionId <= 0) { await t.rollback(); return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' }); }

    const session = await WorkoutSession.findOne({ where: { session_id: sessionId, user_id: userId }, transaction: t, lock: t.LOCK.UPDATE });
    if (!session) { await t.rollback(); return res.status(404).json({ success: false, message: 'Session không tồn tại' }); }
    if (!['in_progress','paused'].includes(session.status)) { await t.rollback(); return res.status(409).json({ success: false, message: 'Session không ở trạng thái đang tập' }); }

    const idx = Number(session.current_exercise_index) || 0;
    const curr = await WorkoutSessionExercise.findOne({ where: { session_id: sessionId, session_order: idx + 1 }, transaction: t, lock: t.LOCK.UPDATE });
    if (!curr) {
      await t.commit();
      return res.status(200).json({ success: true, data: { done: true } });
    }

    await WorkoutSessionExercise.update({ status: 'skipped' }, { where: { session_exercise_id: curr.session_exercise_id }, transaction: t });

    const total = await WorkoutSessionExercise.count({ where: { session_id: sessionId }, transaction: t });
    const nextIdx = Math.min(idx + 1, Math.max(0, total));
    await WorkoutSession.update({ current_exercise_index: nextIdx, status: 'in_progress' }, { where: { session_id: sessionId }, transaction: t });

    await t.commit();
    return res.status(200).json({ success: true, data: { next_index: nextIdx, total } });
  } catch (err) {
    await t.rollback();
    console.error('skipCurrentExercise error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

// POST /api/workout/:sessionId/complete
// Đánh dấu buổi tập đã hoàn thành, tính tổng thời gian buổi
export async function completeSession(req, res) {
  try {
    const userId = req.userId;
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!Number.isFinite(sessionId) || sessionId <= 0) {
      return res.status(400).json({ success: false, message: 'sessionId không hợp lệ' });
    }

    const session = await WorkoutSession.findOne({ where: { session_id: sessionId, user_id: userId } });
    if (!session) return res.status(404).json({ success: false, message: 'Session không tồn tại' });

    if (['completed', 'cancelled'].includes(session.status)) {
      return res.status(200).json({
        success: true,
        data: {
          session_id: sessionId,
          status: session.status,
          total_duration_seconds: session.total_duration_seconds ?? 0,
        },
      });
    }

    const endedAt = new Date();
    const startedAt = session.started_at ? new Date(session.started_at) : endedAt;
    const duration = Math.max(0, Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000));

    await WorkoutSession.update(
      { status: 'completed', ended_at: endedAt, total_duration_seconds: duration },
      { where: { session_id: sessionId, user_id: userId } }
    );

    return res.status(200).json({ success: true, data: { session_id: sessionId, status: 'completed', total_duration_seconds: duration } });
  } catch (err) {
    console.error('completeSession error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}

// GET /api/workout?planId=&status=&limit=&offset=
// List user's workout sessions, optionally filtered by plan and status
export async function listWorkoutSessions(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const planId = req.query.planId ? parseInt(String(req.query.planId), 10) : null;
    const status = String(req.query.status || '').toLowerCase();
    const limit = Math.min(100, parseInt(String(req.query.limit || '20'), 10) || 20);
    const offset = parseInt(String(req.query.offset || '0'), 10) || 0;

    const where = { user_id: userId };
    if (Number.isFinite(planId) && planId > 0) where.plan_id = planId;
    if (status === 'completed') where.status = 'completed';
    else if (status === 'active' || status === 'incomplete' || status === 'in_progress') where.status = { [Op.in]: ['in_progress', 'paused'] };

    const sessions = await WorkoutSession.findAll({
      where,
      order: [['started_at', 'DESC']],
      limit,
      offset,
    });

    // Gather counts per session
    const out = [];
    for (const s of sessions) {
      const total = await WorkoutSessionExercise.count({ where: { session_id: s.session_id } });
      const completedCount = await WorkoutSessionExercise.count({ where: { session_id: s.session_id, status: 'completed' } });
      out.push({
        session_id: s.session_id,
        plan_id: s.plan_id,
        status: s.status,
        started_at: s.started_at,
        ended_at: s.ended_at,
        total_duration_seconds: s.total_duration_seconds,
        current_exercise_index: s.current_exercise_index,
        completed_exercises: completedCount,
        total_exercises: total,
      });
    }

    return res.status(200).json({ success: true, data: { items: out, total: out.length } });
  } catch (err) {
    console.error('listWorkoutSessions error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
  }
}
export async function restartSession(req, res) {
    const t = await sequelize.transaction();

    try {
        const userId = req.userId;
        const oldSessionId = parseInt(req.params?.sessionId, 10);

        if (!userId) {
            await t.rollback();
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        if (!Number.isFinite(oldSessionId) || oldSessionId <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Invalid sessionId" });
        }

        // ============ 1. GET OLD SESSION ============
        const oldSession = await WorkoutSession.findOne({
            where: {
                session_id: oldSessionId,
                user_id: userId
            },
            transaction: t
        });

        if (!oldSession) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Session not found" });
        }

        // Only allow restart if session is active
        if (!['in_progress', 'paused'].includes(oldSession.status)) {
            await t.rollback();
            return res.status(422).json({
                success: false,
                message: "Can only restart active sessions"
            });
        }

        const planId = oldSession.plan_id;
        if (!planId) {
            await t.rollback();
            return res.status(422).json({
                success: false,
                message: "Cannot restart session without plan"
            });
        }

        // ============ 2. COMPLETE OLD SESSION ============
        const endedAt = new Date();
        const durationSeconds = Math.floor((endedAt - oldSession.started_at) / 1000);

        await oldSession.update({
            status: 'completed',
            ended_at: endedAt,
            total_duration_seconds: durationSeconds,
            notes: (oldSession.notes || '') + '\n[Auto-completed for restart]'
        }, { transaction: t });

        // ============ 3. CREATE NEW SESSION (same as createWorkoutSession) ============

        // Get plan
        const plan = await WorkoutPlan.findOne({
            where: { plan_id: planId },
            transaction: t
        });

        if (!plan) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Plan not found" });
        }

        // Check permission
        const hasAccess = plan.creator_id === userId || plan.is_public === true;
        if (!hasAccess) {
            await t.rollback();
            return res.status(403).json({
                success: false,
                message: "No permission to use this plan"
            });
        }

        // Get plan exercises
        const planExercises = await PlanExerciseDetail.findAll({
            where: { plan_id: planId },
            order: [['session_order', 'ASC'], ['plan_exercise_id', 'ASC']],
            transaction: t
        });

        const normalizedExercises = planExercises.map((ex, index) => ({
            plan_exercise_id: ex.plan_exercise_id,
            exercise_id: ex.exercise_id,
            session_order: index + 1,
            target_sets: ex.sets_recommended,
            target_reps: ex.reps_recommended,
            target_rest_seconds: ex.rest_period_seconds
        }));

        // Create new session
        const newSession = await WorkoutSession.create({
            user_id: userId,
            plan_id: planId,
            status: 'in_progress',
            started_at: new Date(),
            current_exercise_index: 0,
            notes: null
        }, { transaction: t });

        // Bulk insert exercises
        const sessionExercises = normalizedExercises.map(ex => ({
            session_id: newSession.session_id,
            plan_exercise_id: ex.plan_exercise_id,
            exercise_id: ex.exercise_id,
            session_order: ex.session_order,
            target_sets: ex.target_sets,
            target_reps: ex.target_reps,
            target_rest_seconds: ex.target_rest_seconds,
            completed_sets: 0,
            status: 'pending'
        }));

        if (sessionExercises.length > 0) {
            sessionExercises[0].status = 'in_progress';
        }

        await WorkoutSessionExercise.bulkCreate(sessionExercises, { transaction: t });

        // ============ 4. COMMIT ============
        await t.commit();

        return res.status(201).json({
            success: true,
            message: "Session restarted successfully",
            data: {
                old_session_id: oldSessionId,
                new_session_id: newSession.session_id,
                plan_id: planId,
                plan_name: plan.name,
                exercises_count: sessionExercises.length,
                started_at: newSession.started_at
            }
        });

    } catch (err) {
        await t.rollback();
        console.error("restartSession error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
}

