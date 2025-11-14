import User from "./user.model.js";
import PasswordReset from "./passwordReset.model.js";
import OnboardingStep from "./onboarding.step.model.js";
import OnboardingField from "./onboarding.field.model.js";
import OnboardingSession from "./onboarding.session.model.js";
import OnboardingAnswer from "./onboarding.answer.model.js";
import Exercise from "./exercise.model.js";
import WorkoutPlan from "./workout.plan.model.js";
import PlanExerciseDetail from "./plan.exercise.detail.model.js";
import UserWorkoutLog from "./user.workout.log.model.js";
import UserWorkoutLogDetail from "./user.workout.log.detail.model.js";
import ExerciseImage from "./exercise.image.model.js";
import LoginHistory from "./login.history.model.js";
import ExerciseFavorite from "./exercise.favorite.model.js";
import WorkoutSession from "./workout.session.model.js";
import WorkoutSessionExercise from "./workout.session.exercise.model.js";
import WorkoutSessionSet from "./workout.session.set.model.js";
import AIUsage from "./ai.usage.model.js";
import SubscriptionPlan from "./subscription.plan.model.js";
import Transaction from "./transaction.model.js";
import BugReport from "./bugReport.model.js";
import Notification from "./notification.model.js";

// ✅ Giữ 1 biến toàn cục
let initialized = false;
let models = {};

export function initModels() {
  if (initialized) return models; // ⚡ tránh đăng ký lại associations

  /* -------------------- AUTH -------------------- */
  User.hasMany(PasswordReset, { foreignKey: "user_id", sourceKey: "user_id", onDelete: "CASCADE" });
  PasswordReset.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", onDelete: "CASCADE" });

  /* -------------------- ONBOARDING -------------------- */
  OnboardingStep.hasMany(OnboardingField, {
    foreignKey: "step_id",
    sourceKey: "step_id",
    as: "fields",
  });
  OnboardingField.belongsTo(OnboardingStep, {
    foreignKey: "step_id",
    targetKey: "step_id",
    as: "stepField",
  });

  User.hasMany(OnboardingSession, {
    foreignKey: "user_id",
    sourceKey: "user_id",
    as: "onboardingSessions",
  });
  OnboardingSession.belongsTo(User, {
    foreignKey: "user_id",
    targetKey: "user_id",
    as: "user",
  });

  OnboardingSession.hasMany(OnboardingAnswer, {
    foreignKey: "session_id",
    sourceKey: "session_id",
    as: "answers",
  });
  OnboardingAnswer.belongsTo(OnboardingSession, {
    foreignKey: "session_id",
    targetKey: "session_id",
    as: "session",
  });

  OnboardingStep.hasMany(OnboardingAnswer, {
    foreignKey: "step_id",
    sourceKey: "step_id",
    as: "stepAnswers",
  });
  OnboardingAnswer.belongsTo(OnboardingStep, {
    foreignKey: "step_id",
    targetKey: "step_id",
    as: "stepAnswer",
  });

  /* -------------------- EXERCISE -------------------- */
  Exercise.hasMany(ExerciseImage, { foreignKey: "exercise_id", sourceKey: "exercise_id", as: "images" });
  ExerciseImage.belongsTo(Exercise, { foreignKey: "exercise_id", targetKey: "exercise_id", as: "exercise" });

  User.hasMany(ExerciseFavorite, { foreignKey: "user_id", sourceKey: "user_id", as: "favoriteExercises" });
  ExerciseFavorite.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "userFavorite" });

  Exercise.hasMany(ExerciseFavorite, { foreignKey: "exercise_id", sourceKey: "exercise_id", as: "favorites" });
  ExerciseFavorite.belongsTo(Exercise, { foreignKey: "exercise_id", targetKey: "exercise_id", as: "exerciseFav" });

  /* -------------------- WORKOUT PLAN -------------------- */
  // Creator relation for admin views and listing
  User.hasMany(WorkoutPlan, { foreignKey: "creator_id", sourceKey: "user_id", as: "plans" });
  WorkoutPlan.belongsTo(User, { foreignKey: "creator_id", targetKey: "user_id", as: "creator" });

  // WorkoutPlan ↔ PlanExerciseDetail
  // Align aliases with controllers: WorkoutPlan.include as 'items', and PlanExerciseDetail.include Exercise as 'exercise'
  WorkoutPlan.hasMany(PlanExerciseDetail, { foreignKey: "plan_id", sourceKey: "plan_id", as: "items" });
  PlanExerciseDetail.belongsTo(WorkoutPlan, { foreignKey: "plan_id", targetKey: "plan_id", as: "plan" });

  Exercise.hasMany(PlanExerciseDetail, { foreignKey: "exercise_id", sourceKey: "exercise_id", as: "planExercises" });
  PlanExerciseDetail.belongsTo(Exercise, { foreignKey: "exercise_id", targetKey: "exercise_id", as: "exercise" });

  /* -------------------- WORKOUT LOG -------------------- */
  User.hasMany(UserWorkoutLog, { foreignKey: "user_id", sourceKey: "user_id", as: "workoutLogs" });
  UserWorkoutLog.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "userLog" });

  WorkoutPlan.hasMany(UserWorkoutLog, { foreignKey: "plan_id", sourceKey: "plan_id", as: "logs" });
  UserWorkoutLog.belongsTo(WorkoutPlan, { foreignKey: "plan_id", targetKey: "plan_id", as: "planLog" });

  UserWorkoutLog.hasMany(UserWorkoutLogDetail, { foreignKey: "log_id", sourceKey: "log_id", as: "sets" });
  UserWorkoutLogDetail.belongsTo(UserWorkoutLog, { foreignKey: "log_id", targetKey: "log_id", as: "logDetail" });

  /* -------------------- WORKOUT SESSION -------------------- */
  User.hasMany(WorkoutSession, { foreignKey: "user_id", sourceKey: "user_id", as: "workoutSessions" });
  WorkoutSession.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "userSession" });

  WorkoutPlan.hasMany(WorkoutSession, { foreignKey: "plan_id", sourceKey: "plan_id", as: "sessions" });
  // Align with controllers: include WorkoutPlan as 'plan'
  WorkoutSession.belongsTo(WorkoutPlan, { foreignKey: "plan_id", targetKey: "plan_id", as: "plan" });

  WorkoutSession.hasMany(WorkoutSessionExercise, { foreignKey: "session_id", sourceKey: "session_id", as: "exercises" });
  WorkoutSessionExercise.belongsTo(WorkoutSession, { foreignKey: "session_id", targetKey: "session_id", as: "sessionExercise" });

  WorkoutSessionExercise.hasMany(WorkoutSessionSet, { foreignKey: "session_exercise_id", sourceKey: "session_exercise_id", as: "sets" });
  WorkoutSessionSet.belongsTo(WorkoutSessionExercise, { foreignKey: "session_exercise_id", targetKey: "session_exercise_id", as: "exerciseSet" });
  // Link WSExercise -> Exercise for details in active session
  WorkoutSessionExercise.belongsTo(Exercise, { foreignKey: "exercise_id", targetKey: "exercise_id", as: "exercise" });

  /* -------------------- BILLING -------------------- */
  User.hasMany(Transaction, { foreignKey: "user_id", sourceKey: "user_id", as: "transactions" });
  Transaction.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "userTransaction" });

  SubscriptionPlan.hasMany(Transaction, { foreignKey: "plan_id", sourceKey: "plan_id", as: "transactions" });
  Transaction.belongsTo(SubscriptionPlan, { foreignKey: "plan_id", targetKey: "plan_id", as: "planTransaction" });

  /* -------------------- SUPPORT -------------------- */
  User.hasMany(BugReport, { foreignKey: "user_id", sourceKey: "user_id", as: "bugReports" });
  BugReport.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "reporter" });
  BugReport.belongsTo(User, { foreignKey: "responded_by", targetKey: "user_id", as: "responder" });

  User.hasMany(Notification, { foreignKey: "user_id", sourceKey: "user_id", as: "notifications" });
  Notification.belongsTo(User, { foreignKey: "user_id", targetKey: "user_id", as: "owner" });

  models = {
    User,
    PasswordReset,
    OnboardingStep,
    OnboardingField,
    OnboardingSession,
    OnboardingAnswer,
    Exercise,
    ExerciseImage,
    ExerciseFavorite,
    WorkoutPlan,
    PlanExerciseDetail,
    UserWorkoutLog,
    UserWorkoutLogDetail,
    LoginHistory,
    WorkoutSession,
    WorkoutSessionExercise,
    WorkoutSessionSet,
    AIUsage,
    SubscriptionPlan,
    Transaction,
    BugReport,
    Notification,
  };

  initialized = true;
  return models;
}

// ✅ Giữ 1 instance duy nhất
const db = initModels();
export default db;
