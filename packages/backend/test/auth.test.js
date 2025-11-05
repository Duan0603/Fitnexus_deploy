// packages/backend/test/auth.test.js
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";

import app from "../app.js";
import { installModelStubs, resetMockDb } from "./helpers/mockDb.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_key";
process.env.NODE_ENV = "test";

installModelStubs();

function makeToken(userId = 1) {
  return jwt.sign({ sub: userId, role: "USER", type: "access" }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

describe("Auth API", () => {
  beforeEach(() => resetMockDb(1));

  test("me: unauthorized without token", async () => {
    const res = await request(app).get("/api/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test("me: success with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${makeToken(1)}` });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user_id, 1);
  });
});

