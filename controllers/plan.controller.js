import { Op } from "sequelize";
import WorkoutPlan from "../models/workout.plan.model.js";
import PlanExerciseDetail from "../models/plan.exercise.detail.model.js";
import Exercise from "../models/exercise.model.js";
import { sequelize } from "../config/database.js";

function normalizeDifficulty(v) {
  const s = String(v || "").toLowerCase().trim();
  if (["beginner", "intermediate", "advanced"].includes(s)) return s;
  return null;
}

export async function createPlan(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });

    const name = String(req.body?.name || "").trim();
    const description = req.body?.description != null ? String(req.body.description) : null;
    const difficulty_level = normalizeDifficulty(req.body?.difficulty_level);
    const is_public = req.body?.is_public === true || req.body?.is_public === false ? !!req.body.is_public : false;

    if (!name) return res.status(422).json({ success: false, message: "name is required" });

    const plan = await WorkoutPlan.create({
      name,
      description,
      creator_id: userId,
      difficulty_level,
      is_public,
    });

    return res.status(200).json({ success: true, data: {
      plan_id: plan.plan_id,
      name: plan.name,
      description: plan.description,
      difficulty_level: plan.difficulty_level,
      is_public: plan.is_public,
    }});
  } catch (err) {
    console.error("createPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function getPlanById(req, res) {
  try {
    const userId = req.userId;
    const planId = parseInt(req.params?.planId, 10);
    if (!Number.isFinite(planId) || planId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid planId" });
    }

    const plan = await WorkoutPlan.findOne({ where: { plan_id: planId } });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    // Only owner can view for now (extend later for public share)
    if (plan.creator_id !== userId) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const items = await PlanExerciseDetail.findAll({
      where: { plan_id: planId },
      order: [["session_order", "ASC"], ["plan_exercise_id", "ASC"]],
      include: [{
        model: Exercise,
        as: "exercise",
        attributes: [
          ["exercise_id", "id"],
          "name",
          "difficulty_level",
          "equipment_needed",
          "thumbnail_url",
          "gif_demo_url",
        ],
      }],
    });

    // Prefer primary image from image_exercise if available
    const exIds = items.map(it => it.exercise_id).filter((v, i, a) => a.indexOf(v) === i);
    let imgMap = new Map();
    if (exIds.length) {
      const [rows] = await sequelize.query(
        `SELECT exercise_id, image_url
         FROM (
           SELECT exercise_id, image_url,
                  ROW_NUMBER() OVER (PARTITION BY exercise_id ORDER BY is_primary DESC, display_order ASC, image_id ASC) AS rn
           FROM image_exercise
           WHERE exercise_id = ANY($1)
         ) s WHERE rn = 1`,
        { bind: [exIds] }
      );
      imgMap = new Map(rows.map(r => [r.exercise_id, r.image_url]));
    }

    const payloadItems = items.map(it => ({
      plan_exercise_id: it.plan_exercise_id,
      plan_id: it.plan_id,
      exercise_id: it.exercise_id,
      session_order: it.session_order,
      sets_recommended: it.sets_recommended,
      reps_recommended: it.reps_recommended,
      rest_period_seconds: it.rest_period_seconds,
      exercise: it.exercise ? {
        id: it.exercise.get("id"),
        name: it.exercise.name,
        difficulty: it.exercise.difficulty_level,
        equipment: it.exercise.equipment_needed,
        imageUrl: imgMap.get(it.exercise_id) || it.exercise.thumbnail_url || it.exercise.gif_demo_url || null,
      } : null,
    }));

    return res.status(200).json({ success: true, data: {
      plan: {
        plan_id: plan.plan_id,
        name: plan.name,
        description: plan.description,
        difficulty_level: plan.difficulty_level,
        is_public: plan.is_public,
      },
      items: payloadItems,
    }});
  } catch (err) {
    console.error("getPlanById error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function addExerciseToPlan(req, res) {
  try {
    const userId = req.userId;
    const planId = parseInt(req.params?.planId, 10);
    if (!Number.isFinite(planId) || planId <= 0) {
      return res.status(400).json({ success: false, message: "Invalid planId" });
    }

    const plan = await WorkoutPlan.findOne({ where: { plan_id: planId } });
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    if (plan.creator_id !== userId) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const exercise_id = parseInt(req.body?.exercise_id, 10);
    if (!Number.isFinite(exercise_id) || exercise_id <= 0) {
      return res.status(422).json({ success: false, message: "exercise_id is required" });
    }
    const exercise = await Exercise.findByPk(exercise_id);
    if (!exercise) {
      return res.status(422).json({ success: false, message: "exercise_id not found" });
    }

    let session_order = req.body?.session_order;
    if (!Number.isFinite(session_order)) {
      const maxRow = await PlanExerciseDetail.findOne({
        where: { plan_id: planId },
        order: [["session_order", "DESC"]],
        attributes: ["session_order"],
      });
      const maxVal = maxRow?.session_order || 0;
      session_order = maxVal + 1;
    }

    const sets_recommended = Number.isFinite(parseInt(req.body?.sets_recommended, 10)) ? parseInt(req.body?.sets_recommended, 10) : null;
    const reps_recommended = req.body?.reps_recommended != null ? String(req.body.reps_recommended) : null;
    const rest_period_seconds = Number.isFinite(parseInt(req.body?.rest_period_seconds, 10)) ? parseInt(req.body?.rest_period_seconds, 10) : null;

    const item = await PlanExerciseDetail.create({
      plan_id: planId,
      exercise_id,
      session_order,
      sets_recommended,
      reps_recommended,
      rest_period_seconds,
    });

    return res.status(200).json({ success: true, data: {
      plan_exercise_id: item.plan_exercise_id,
      plan_id: item.plan_id,
      exercise_id: item.exercise_id,
      session_order: item.session_order,
      sets_recommended: item.sets_recommended,
      reps_recommended: item.reps_recommended,
      rest_period_seconds: item.rest_period_seconds,
    }});
  } catch (err) {
    console.error("addExerciseToPlan error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

export async function listMyPlans(req, res) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthenticated" });
    // only mine when mine=1
    const mine = String(req.query?.mine || "").trim();
    if (mine === "1" || mine.toLowerCase() === "true") {
      const rows = await WorkoutPlan.findAll({
        where: { creator_id: userId },
        order: [["plan_id", "DESC"]],
      });
      const items = rows.map((p) => ({
        plan_id: p.plan_id,
        name: p.name,
        description: p.description,
        difficulty_level: p.difficulty_level,
        is_public: p.is_public,
      }));
      return res.status(200).json({ success: true, data: { items, total: items.length } });
    }
    return res.status(403).json({ success: false, message: "Forbidden" });
  } catch (err) {
    console.error("listMyPlans error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
// Add this function to your plan.controller.js

// Add this function to your plan.controller.js
// Make sure you have: import { sequelize } from "../config/database.js";

export async function reorderPlanExercises(req, res) {
    const t = await sequelize.transaction();
    try {
        const userId = req.userId;
        const planId = parseInt(req.params?.planId, 10);

        if (!Number.isFinite(planId) || planId <= 0) {
            await t.rollback();
            return res.status(400).json({ success: false, message: "Invalid planId" });
        }

        // Verify plan ownership
        const plan = await WorkoutPlan.findOne({ where: { plan_id: planId }, transaction: t });
        if (!plan) {
            await t.rollback();
            return res.status(404).json({ success: false, message: "Plan not found" });
        }
        if (plan.creator_id !== userId) {
            await t.rollback();
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Expect array of { plan_exercise_id, session_order }
        const updates = req.body?.exercises;
        if (!Array.isArray(updates) || updates.length === 0) {
            await t.rollback();
            return res.status(422).json({ success: false, message: "exercises array required" });
        }

        // STEP 1: Bump all session_order by +10000 to avoid unique constraint conflicts
        await sequelize.query(
            `UPDATE plan_exercise_details
             SET session_order = session_order + 10000
             WHERE plan_id = :planId`,
            {
                replacements: { planId },
                transaction: t,
            }
        );

        // STEP 2: Update each exercise's session_order to the new value
        for (const item of updates) {
            const plan_exercise_id = parseInt(item?.plan_exercise_id, 10);
            const session_order = parseInt(item?.session_order, 10);

            if (!Number.isFinite(plan_exercise_id) || !Number.isFinite(session_order)) {
                await t.rollback();
                return res.status(422).json({
                    success: false,
                    message: "Invalid plan_exercise_id or session_order"
                });
            }

            await PlanExerciseDetail.update(
                { session_order },
                {
                    where: {
                        plan_exercise_id,
                        plan_id: planId
                    },
                    transaction: t
                }
            );
        }

        await t.commit();
        return res.status(200).json({
            success: true,
            message: "Exercises reordered successfully"
        });
    } catch (err) {
        await t.rollback();
        console.error("reorderPlanExercises error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
}

// Add this function to your plan.controller.js

export async function updatePlanExercise(req, res) {
    try {
        const userId = req.userId;
        const planId = parseInt(req.params?.planId, 10);
        const planExerciseId = parseInt(req.params?.planExerciseId, 10);

        if (!Number.isFinite(planId) || planId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid planId" });
        }
        if (!Number.isFinite(planExerciseId) || planExerciseId <= 0) {
            return res.status(400).json({ success: false, message: "Invalid planExerciseId" });
        }

        // Verify plan ownership
        const plan = await WorkoutPlan.findOne({ where: { plan_id: planId } });
        if (!plan) {
            return res.status(404).json({ success: false, message: "Plan not found" });
        }
        if (plan.creator_id !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const planExercise = await PlanExerciseDetail.findOne({
            where: {
                plan_exercise_id: planExerciseId,
                plan_id: planId,
            },
        });

        if (!planExercise) {
            return res.status(404).json({ success: false, message: "Exercise not found in plan" });
        }
        const updateData = {};

        if (req.body?.sets_recommended !== undefined) {
            const sets = parseInt(req.body.sets_recommended, 10);
            updateData.sets_recommended = Number.isFinite(sets) && sets > 0 ? sets : null;
        }

        if (req.body?.reps_recommended !== undefined) {
            updateData.reps_recommended = req.body.reps_recommended != null
                ? String(req.body.reps_recommended).trim()
                : null;
        }

        if (req.body?.rest_period_seconds !== undefined) {
            const rest = parseInt(req.body.rest_period_seconds, 10);
            updateData.rest_period_seconds = Number.isFinite(rest) && rest >= 0 ? rest : null;
        }

        // Update the record
        await planExercise.update(updateData);

        return res.status(200).json({
            success: true,
            data: {
                plan_exercise_id: planExercise.plan_exercise_id,
                sets_recommended: planExercise.sets_recommended,
                reps_recommended: planExercise.reps_recommended,
                rest_period_seconds: planExercise.rest_period_seconds,
            },
        });
    } catch (err) {
        console.error("updatePlanExercise error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}