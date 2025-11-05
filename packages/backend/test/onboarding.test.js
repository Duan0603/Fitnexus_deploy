// packages/backend/test/onboarding.test.js
// Node test runner + supertest integration tests for onboarding flow

import { test, beforeEach, describe } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../app.js";
import { installModelStubs, resetMockDb, mockState } from "./helpers/mockDb.js";

// Ensure JWT secret is available
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";
process.env.NODE_ENV = "test";

installModelStubs();

function makeToken(userId = 1) {
  return jwt.sign({ sub: userId, role: "USER", type: "access" }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(() => {
  resetMockDb(1);
});

describe("Onboarding API", () => {
  test("1) Unauthorized – session", async () => {
    const res = await request(app).get("/api/onboarding/session");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test("2) Unauthorized – get step", async () => {
    const res = await request(app).get("/api/onboarding/steps/age");
    assert.equal(res.status, 401);
  });

  test("3) Get step hợp lệ", async () => {
    const token = makeToken();
    const res = await request(app).get("/api/onboarding/steps/age").set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.step.step_key, "age");
    assert.equal(res.body.data.fields[0].field_key, "age_group");
    assert.equal(res.body.data.fields[0].required, true);
  });

  test("4) Get step không tồn tại", async () => {
    const token = makeToken();
    const res = await request(app).get("/api/onboarding/steps/unknown").set(auth(token));
    assert.equal(res.status, 404);
  });

  test("5) Session lần đầu – bước đầu là age", async () => {
    const token = makeToken();
    const res = await request(app).get("/api/onboarding/session").set(auth(token));
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.required, true);
    assert.equal(res.body.data.completed, false);
    assert.equal(res.body.data.currentStepKey, "age");
  });

  test("6) Lưu answer thiếu body", async () => {
    const token = makeToken();
    const res = await request(app).post("/api/onboarding/steps/age/answer").set(auth(token)).send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test("7) Radio/select – giá trị ngoài danh sách", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/age/answer")
      .set(auth(token))
      .send({ answers: { age_group: "INVALID" } });
    assert.equal(res.status, 422);
  });

  test("8) Number – sai kiểu dữ liệu", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/weight/answer")
      .set(auth(token))
      .send({ answers: { weight_kg: "seventy" } });
    assert.equal(res.status, 422);
  });

  test("9) Number – ngoài min/max", async () => {
    const token = makeToken();
    const tooLow = await request(app)
      .post("/api/onboarding/steps/weight/answer")
      .set(auth(token))
      .send({ answers: { weight_kg: 25 } });
    assert.equal(tooLow.status, 422);
    const tooHigh = await request(app)
      .post("/api/onboarding/steps/weight/answer")
      .set(auth(token))
      .send({ answers: { weight_kg: 350 } });
    assert.equal(tooHigh.status, 422);
  });

  test("10) Select – giá trị hợp lệ (experience)", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/experience_level/answer")
      .set(auth(token))
      .send({ answers: { experience_level: "BEGINNER" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.nextStepKey); // vẫn còn bước thiếu
  });

  test("11) workout_frequency – ép 3 -> '3'", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/workout_frequency/answer")
      .set(auth(token))
      .send({ answers: { workout_days_per_week: 3 } });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("12) workout_frequency – giá trị không hợp lệ", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/workout_frequency/answer")
      .set(auth(token))
      .send({ answers: { workout_days_per_week: "10" } });
    assert.equal(res.status, 422);
  });

  test("13) Lọc field lạ – không ảnh hưởng flow", async () => {
    const token = makeToken();
    const res = await request(app)
      .post("/api/onboarding/steps/goal/answer")
      .set(auth(token))
      .send({ answers: { goal: "BUILD_MUSCLE", extra: "ignored" } });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("14) Ghi đè câu trả lời – idempotent", async () => {
    const token = makeToken();
    // lần 1
    const r1 = await request(app)
      .post("/api/onboarding/steps/age/answer")
      .set(auth(token))
      .send({ answers: { age_group: "AGE_16_29" } });
    assert.equal(r1.status, 200);
    // lần 2 ghi đè
    const r2 = await request(app)
      .post("/api/onboarding/steps/age/answer")
      .set(auth(token))
      .send({ answers: { age_group: "AGE_30_39" } });
    assert.equal(r2.status, 200);
    // kiểm tra state mock: giá trị đã đổi
    const stepAge = mockState.steps.find(s => s.step_key === "age");
    const session = mockState.sessions.find(s => s.user_id === 1 && s.is_completed === false) || mockState.sessions[0];
    const ans = mockState.answers.find(a => a.session_id === session.session_id && a.step_id === stepAge.step_id);
    assert.equal(ans.answers.age_group, "AGE_30_39");
  });

  test("15) Hoàn tất toàn bộ quy trình", async () => {
    const token = makeToken();
    const authH = auth(token);
    // Trả lời tất cả bước với dữ liệu hợp lệ
    await request(app).post("/api/onboarding/steps/age/answer").set(authH).send({ answers: { age_group: "AGE_16_29" } });
    await request(app).post("/api/onboarding/steps/body_type/answer").set(authH).send({ answers: { body_type: "NORMAL" } });
    await request(app).post("/api/onboarding/steps/goal/answer").set(authH).send({ answers: { goal: "BUILD_MUSCLE" } });
    await request(app).post("/api/onboarding/steps/weight/answer").set(authH).send({ answers: { weight_kg: 75 } });
    await request(app).post("/api/onboarding/steps/height/answer").set(authH).send({ answers: { height_cm: 175 } });
    await request(app).post("/api/onboarding/steps/level_body_fat/answer").set(authH).send({ answers: { body_fat_level: "NORMAL" } });
    await request(app).post("/api/onboarding/steps/experience_level/answer").set(authH).send({ answers: { experience_level: "BEGINNER" } });
    const last = await request(app).post("/api/onboarding/steps/workout_frequency/answer").set(authH).send({ answers: { workout_days_per_week: "3" } });
    assert.equal(last.status, 200);
    assert.equal(last.body.success, true);
    assert.equal(last.body.data.completed, true);
    assert.equal(last.body.data.nextStepKey, null);

    // GET /session → completed
    const s = await request(app).get("/api/onboarding/session").set(authH);
    assert.equal(s.status, 200);
    assert.equal(s.body.data.completed, true);
    assert.equal(s.body.data.required, false);

    // /api/auth/me phản ánh completed_at
    const me = await request(app).get("/api/auth/me").set(authH);
    assert.equal(me.status, 200);
    const user = me.body.data;
    assert.ok(user.onboarding_completed_at || user.onboardingCompletedAt);
  });
});

