import { Router } from "express";
import authGuard from "../middleware/auth.guard.js";
import {
  getAllExercises,
  getExercisesByMuscleGroup,
  getExerciseStepsById,
  getExerciseStepsBySlug,
  getExercisesByType,
  postFavorite,
  deleteFavorite,
  getFavoriteStatus,
  getRelatedExercisesById,
  getExerciseMusclesById,
} from "../controllers/exercise.controller.js";

const router = Router();

/* -------------------- Basic Exercise Routes -------------------- */
router.get("/", getAllExercises);
router.get("/muscle/:muscleGroup", getExercisesByMuscleGroup);
router.get("/type/:type", getExercisesByType);
router.get("/id/:exerciseId/steps", getExerciseStepsById);
router.get("/slug/:slug/steps", getExerciseStepsBySlug);

/* -------------------- Favorites -------------------- */
// POST: thêm vào yêu thích
// DELETE: xoá khỏi yêu thích
// GET: kiểm tra trạng thái yêu thích của user hiện tại
router.post("/:exerciseId/favorite", authGuard, postFavorite);
router.delete("/:exerciseId/favorite", authGuard, deleteFavorite);
router.get("/:exerciseId/favorite", authGuard, getFavoriteStatus);

/* -------------------- Related & Muscles -------------------- */
// Lấy danh sách bài tập liên quan
router.get("/id/:exerciseId/related", getRelatedExercisesById);

// Lấy thông tin chi tiết nhóm cơ của bài tập
router.get("/id/:exerciseId/muscles", getExerciseMusclesById);

export default router;
