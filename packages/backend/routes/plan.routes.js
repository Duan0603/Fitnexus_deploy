import { Router } from "express";
import authOrSession from "../middleware/authOrSession.guard.js";
import authGuard from "../middleware/auth.guard.js";
import {
    createPlan,
    getPlanById,
    addExerciseToPlan,
    listMyPlans,
    reorderPlanExercises,
    updatePlanExercise,
    deletePlan,
    deleteExerciseFromPlan
} from "../controllers/plan.controller.js";

const router = Router();

// List my plans with ?mine=1
// Accept both JWT (mobile/web) and Passport session (OAuth) for plan APIs
router.get("/", authOrSession, listMyPlans);

router.post("/", authOrSession, createPlan);

router.get("/:planId", authOrSession, getPlanById);

router.delete("/:planId", authOrSession, deletePlan);

router.post("/:planId/exercises", authOrSession, addExerciseToPlan);

router.put("/:planId/exercises/reorder", authGuard, reorderPlanExercises)

router.patch("/:planId/exercises/:planExerciseId", authGuard, updatePlanExercise);

router.delete("/:planId/exercises/:planExerciseId", authGuard, deleteExerciseFromPlan);



export default router;
