// packages/backend/controllers/admin.plan.controller.js
import { Op } from "sequelize";
import { sequelize } from "../config/database.js";
import WorkoutPlan from "../models/workout.plan.model.js";
import User from "../models/user.model.js";
import Exercise from "../models/exercise.model.js";
import PlanExerciseDetail from "../models/plan.exercise.detail.model.js";

/**
 * GET /api/admin/users/:userId/plans
 * Get all plans of a specific user
 */
export async function getUserPlans(req, res) {
  try {
    const { userId } = req.params;
    
    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's plans with exercises
    const plans = await WorkoutPlan.findAll({
      where: {
        creator_id: userId
      },
      attributes: ['plan_id', 'name', 'description', 'difficulty_level', 'is_public'],
      include: [
        {
          model: PlanExerciseDetail,
          as: 'items',
          include: [{
            model: Exercise,
            as: 'exercise',
            attributes: ['exercise_id', 'name', 'name_en', 'description']
          }]
        }
      ],
      // `workout_plans` model has timestamps: false, so ordering by created_at errors
      order: [['plan_id', 'DESC']]
    });

    return res.json({
      success: true,
      data: {
    user,
      plans
      }
    });

  } catch (err) {
    console.error('Error getting user plans:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

/**
 * GET /api/admin/user-plans
 * Query: limit, offset, search
 */
export async function listUserPlans(req, res) {
  try {
    const limitRaw = parseInt(req.query.limit ?? "50", 10);
    const offsetRaw = parseInt(req.query.offset ?? "0", 10);
    const limit = Math.min(Math.max(1, isNaN(limitRaw) ? 50 : limitRaw), 200);
    const offset = Math.max(0, isNaN(offsetRaw) ? 0 : offsetRaw);

    const search = String(req.query.search ?? "").trim();

    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { rows, count } = await WorkoutPlan.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'username', 'email'],
          required: true
        },
        {
          model: PlanExerciseDetail,
          as: 'items',
          include: [{
            model: Exercise,
            as: 'exercise',
            attributes: ['exercise_id', 'name', 'name_en']
          }]
        }
      ],
      order: [['plan_id', 'DESC']],
      limit,
      offset
    });

    return res.json({
      success: true,
      data: {
        items: rows,
        total: count,
        limit,
        offset
      }
    });
  } catch (err) {
    console.error('Admin listUserPlans error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
export async function getUserPlanById(req, res) {
  try {
    const { userId, planId } = req.params;

    // (không bắt buộc) kiểm tra user tồn tại
    const user = await User.findByPk(userId, {
      attributes: ['user_id', 'username', 'email'],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const plan = await WorkoutPlan.findOne({
      where: { plan_id: planId, creator_id: userId },
      attributes: ['plan_id', 'name', 'description', 'difficulty_level', 'is_public'],
      include: [
        {
          model: PlanExerciseDetail,
          as: 'items',
          include: [
            {
              model: Exercise,
              as: 'exercise',
              attributes: ['exercise_id', 'name', 'name_en', 'description'],
            },
          ],
        },
      ],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    return res.json({
      success: true,
      data: { user, plan },
    });
  } catch (err) {
    console.error('Admin getUserPlanById error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
/**
 * GET /api/admin/user-plans/:id
 */
export async function getUserPlan(req, res) {
  try {
    const planId = req.params.id;
    
    const plan = await UserPlan.findByPk(planId, {
      include: [{
        model: User,
        as: 'user',
        required: true
      }]
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    return res.json({
      success: true,
      data: plan
    });

  } catch (err) {
    console.error('Admin getUserPlan error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * PUT /api/admin/user-plans/:id/status
 * Body: { status }
 */
export async function updatePlanStatus(req, res) {
  try {
    const planId = req.params.id;
    const { status } = req.body;

    if (!["ACTIVE", "COMPLETED", "CANCELLED"].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const plan = await UserPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await plan.update({ status });

    return res.json({
      success: true,
      message: 'Plan status updated successfully',
      data: plan
    });

  } catch (err) {
    console.error('Admin updatePlanStatus error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

/**
 * DELETE /api/admin/user-plans/:id
 */
export async function deletePlan(req, res) {
  try {
    const planId = req.params.id;
    
    const plan = await UserPlan.findByPk(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    await plan.destroy();

    return res.json({
      success: true,
      message: 'Plan deleted successfully'
    });

  } catch (err) {
    console.error('Admin deletePlan error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}