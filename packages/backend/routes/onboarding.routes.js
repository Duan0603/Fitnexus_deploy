import express from "express";
import authOrSession from "../middleware/authOrSession.guard.js";
import { getStep, saveAnswer, getSessionStatus } from "../controllers/onboarding.controller.js";

const router = express.Router();

router.use(authOrSession);

router.get("/session", getSessionStatus);

router.get("/steps/:key", getStep);

router.post("/steps/:key/answer", saveAnswer);

export default router;
