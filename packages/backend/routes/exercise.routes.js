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
  listMyFavorites,
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
// GET favorite status does not require auth; supports JWT or Passport session if available
router.get("/:exerciseId/favorite", getFavoriteStatus);
router.get("/favorites", authGuard, listMyFavorites);

/* -------------------- Related & Muscles -------------------- */
// Lấy danh sách bài tập liên quan
router.get("/id/:exerciseId/related", getRelatedExercisesById);

// Lấy thông tin chi tiết nhóm cơ của bài tập
router.get("/id/:exerciseId/muscles", getExerciseMusclesById);

export default router;
