// Lightweight in-memory stubs for onboarding-related Sequelize models
// Used by node:test + supertest integration tests

import OnboardingStep from "../../models/onboarding.step.model.js";
import OnboardingField from "../../models/onboarding.field.model.js";
import OnboardingAnswer from "../../models/onboarding.answer.model.js";
import OnboardingSession from "../../models/onboarding.session.model.js";
import User from "../../models/user.model.js";
import { sequelize } from "../../config/database.js";

// Shared mutable state for tests
export const mockState = {
  steps: [],
  fields: [],
  sessions: [],
  answers: [],
  users: [],
};

function now() { return new Date(); }
function sortByOrder(a, b) { return (a.order_index || 0) - (b.order_index || 0); }

function newUuid() {
  // Simple uuid v4-ish generator sufficient for tests
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function seedDefaultOnboarding(userId = 1) {
  mockState.steps = [
    { step_id: 1, step_key: "age", title: "Tuoi", order_index: 1, is_active: true },
    { step_id: 2, step_key: "body_type", title: "Body type", order_index: 2, is_active: true },
    { step_id: 3, step_key: "goal", title: "Goal", order_index: 3, is_active: true },
    { step_id: 4, step_key: "weight", title: "Weight", order_index: 4, is_active: true },
    { step_id: 5, step_key: "height", title: "Height", order_index: 5, is_active: true },
    { step_id: 6, step_key: "level_body_fat", title: "Body fat", order_index: 6, is_active: true },
    { step_id: 7, step_key: "experience_level", title: "Experience", order_index: 7, is_active: true },
    { step_id: 8, step_key: "workout_frequency", title: "Frequency", order_index: 8, is_active: true },
  ];

  const stepIdByKey = Object.fromEntries(mockState.steps.map(s => [s.step_key, s.step_id]));

  mockState.fields = [
    // age
    { field_id: 1, step_id: stepIdByKey.age, field_key: "age_group", label: "Age group", input_type: "radio", required: true, order_index: 1, metadata: { options: [
      { key: "AGE_16_29", label: "16-29" },
      { key: "AGE_30_39", label: "30-39" },
      { key: "AGE_40_49", label: "40-49" },
      { key: "AGE_50_PLUS", label: "50+" },
    ]}},

    // body_type
    { field_id: 2, step_id: stepIdByKey.body_type, field_key: "body_type", label: "Body type", input_type: "radio", required: true, order_index: 1, metadata: { options: [
      { key: "SKINNY", label: "Skinny" },
      { key: "NORMAL", label: "Normal" },
      { key: "OVERWEIGHT", label: "Overweight" },
      { key: "MUSCULAR", label: "Muscular" },
    ]}},

    // goal
    { field_id: 3, step_id: stepIdByKey.goal, field_key: "goal", label: "Goal", input_type: "radio", required: true, order_index: 1, metadata: { options: [
      { key: "LOSE_FAT", label: "Lose fat" },
      { key: "BUILD_MUSCLE", label: "Build muscle" },
      { key: "MAINTAIN", label: "Maintain" },
    ]}},

    // weight
    { field_id: 4, step_id: stepIdByKey.weight, field_key: "weight_kg", label: "Weight (kg)", input_type: "number", required: true, order_index: 1, metadata: { min: 30, max: 300, step: 0.1 }},

    // height
    { field_id: 5, step_id: stepIdByKey.height, field_key: "height_cm", label: "Height (cm)", input_type: "number", required: true, order_index: 1, metadata: { min: 120, max: 230, step: 0.5 }},

    // level_body_fat
    { field_id: 6, step_id: stepIdByKey.level_body_fat, field_key: "body_fat_level", label: "Body fat level", input_type: "radio", required: true, order_index: 1, metadata: { options: [
      { key: "VERY_LOW", label: "Very low" },
      { key: "LOW", label: "Low" },
      { key: "NORMAL", label: "Normal" },
      { key: "HIGH", label: "High" },
    ]}},

    // experience_level
    { field_id: 7, step_id: stepIdByKey.experience_level, field_key: "experience_level", label: "Experience", input_type: "select", required: true, order_index: 1, metadata: { options: [
      { key: "BEGINNER", label: "Beginner" },
      { key: "INTERMEDIATE", label: "Intermediate" },
      { key: "ADVANCED", label: "Advanced" },
    ]}},

    // workout_frequency
    { field_id: 8, step_id: stepIdByKey.workout_frequency, field_key: "workout_days_per_week", label: "Days per week", input_type: "select", required: true, order_index: 1, metadata: { options: [1,2,3,4,5,6,7].map(n => ({ key: String(n), label: `${n}` })) }},
  ];

  mockState.sessions = [];
  mockState.answers = [];
  mockState.users = [
    {
      user_id: userId,
      username: "testuser",
      email: "test@example.com",
      status: "ACTIVE",
      isLocked: false,
      onboarding_completed_at: null,
      toJSON() {
        return { user_id: this.user_id, username: this.username, email: this.email, onboarding_completed_at: this.onboarding_completed_at };
      },
      async update(patch) { Object.assign(this, patch); return this; },
      get() { return this; },
    },
  ];
}

// Install stubs on Sequelize models and sequelize.transaction
export function installModelStubs() {
  // Steps
  OnboardingStep.findOne = async ({ where, order } = {}) => {
    const list = mockState.steps
      .filter(s => (where?.step_key ? s.step_key === where.step_key : true))
      .filter(s => (where?.is_active !== undefined ? s.is_active === where.is_active : true))
      .slice();
    if (order?.length) list.sort(sortByOrder);
    return list[0] || null;
  };
  OnboardingStep.findAll = async ({ where, order } = {}) => {
    const list = mockState.steps
      .filter(s => (where?.is_active !== undefined ? s.is_active === where.is_active : true))
      .slice();
    if (order?.length) list.sort(sortByOrder);
    return list;
  };

  // Fields
  OnboardingField.findAll = async ({ where, order } = {}) => {
    const stepIds = Array.isArray(where?.step_id) ? where.step_id : where?.step_id ? [where.step_id] : [];
    const list = stepIds.length ? mockState.fields.filter(f => stepIds.includes(f.step_id)) : mockState.fields.slice();
    if (order?.length) list.sort((a, b) => (a.order_index || 0) - (b.order_index || 0) || (a.field_id - b.field_id));
    return list;
  };

  // Answers
  function wrapAnswer(row) {
    return {
      ...row,
      async update(patch) { Object.assign(row, patch); return wrapAnswer(row); },
      get answers() { return row.answers; },
    };
  }
  OnboardingAnswer.findOne = async ({ where } = {}) => {
    const found = mockState.answers.find(a =>
      (where?.session_id ? a.session_id === where.session_id : true) &&
      (where?.step_id ? a.step_id === where.step_id : true)
    );
    return found ? wrapAnswer(found) : null;
  };
  OnboardingAnswer.findAll = async ({ where } = {}) => {
    const list = mockState.answers.filter(a => (where?.session_id ? a.session_id === where.session_id : true));
    return list.map(wrapAnswer);
  };
  OnboardingAnswer.create = async (payload/*, opts*/) => {
    const row = { answer_id: mockState.answers.length + 1, created_at: now(), updated_at: now(), ...payload };
    mockState.answers.push(row);
    return wrapAnswer(row);
  };

  // Sessions
  function wrapSession(row) {
    return {
      ...row,
      async update(patch) { Object.assign(row, patch, { updated_at: now() }); return wrapSession(row); },
    };
  }
  OnboardingSession.findOne = async ({ where, order } = {}) => {
    let list = mockState.sessions.filter(s =>
      (where?.user_id !== undefined ? s.user_id === where.user_id : true) &&
      (where?.is_completed !== undefined ? s.is_completed === where.is_completed : true)
    );
    if (order?.length) list = list.slice().sort((a, b) => b.created_at - a.created_at);
    return list[0] ? wrapSession(list[0]) : null;
  };
  OnboardingSession.create = async (payload/*, opts*/) => {
    const row = { session_id: newUuid(), created_at: now(), updated_at: now(), is_completed: false, current_step_key: null, ...payload };
    mockState.sessions.unshift(row);
    return wrapSession(row);
  };

  // Users
  function wrapUser(row) {
    return {
      ...row,
      async update(patch) { Object.assign(row, patch); return wrapUser(row); },
      toJSON() { return row.toJSON ? row.toJSON() : { ...row }; },
      get(k) { return k ? row[k] : row; },
    };
  }
  User.findByPk = async (id/*, opts*/) => {
    const row = mockState.users.find(u => u.user_id === id);
    return row ? wrapUser(row) : null;
  };

  // sequelize.transaction: support both t = await sequelize.transaction() and await sequelize.transaction(cb)
  const makeT = () => ({
    async commit() { /* no-op */ },
    async rollback() { /* no-op */ },
  });
  sequelize.transaction = async (arg) => {
    if (typeof arg === "function") {
      const t = makeT();
      return await arg(t);
    }
    return makeT();
  };
}

export function resetMockDb(userId = 1) {
  seedDefaultOnboarding(userId);
}

