// packages/frontend/src/features/onboarding/__tests__/OnboardingManager.profile.test.js
// Run with: NODE_OPTIONS=--experimental-vm-modules npx jest --runInBand

import OnboardingManager from "../OnboardingManager.js";

describe("OnboardingManager — Profile functions", () => {
  let flow;
  beforeEach(() => {
    flow = new OnboardingManager("user-1");
    flow.start();
  });

  describe("updateProfileField()", () => {
    test("happy: cập nhật từng field hợp lệ", () => {
      expect(flow.updateProfileField("age", 30)).toBe(true);
      expect(flow.profile.age).toBe(30);

      expect(flow.updateProfileField("heightCm", 175)).toBe(true);
      expect(flow.profile.heightCm).toBe(175);

      expect(flow.updateProfileField("weightKg", 70)).toBe(true);
      expect(flow.profile.weightKg).toBe(70);

      expect(flow.updateProfileField("goal", "lose_weight")).toBe(true);
      expect(flow.profile.goal).toBe("lose_weight");

      expect(flow.updateProfileField("allergies", [])).toBe(true);
      expect(flow.profile.allergies).toEqual([]);
    });

    test("edge: giới hạn biên số học", () => {
      expect(flow.updateProfileField("age", 5)).toBe(true);
      expect(flow.updateProfileField("age", 120)).toBe(true);

      expect(flow.updateProfileField("heightCm", 80)).toBe(true);
      expect(flow.updateProfileField("heightCm", 250)).toBe(true);

      expect(flow.updateProfileField("weightKg", 20)).toBe(true);
      expect(flow.updateProfileField("weightKg", 300)).toBe(true);

      expect(flow.updateProfileField("allergies", ["nuts", "milk"])).toBe(true);
    });

    test("error: field không hợp lệ", () => {
      expect(() => flow.updateProfileField("email", "x")).toThrow("Invalid field");
    });

    test("error: age invalid (range/type)", () => {
      expect(() => flow.updateProfileField("age", 4)).toThrow("Invalid age");
      expect(() => flow.updateProfileField("age", 121)).toThrow("Invalid age");
      expect(() => flow.updateProfileField("age", NaN)).toThrow("Invalid age");
      expect(() => flow.updateProfileField("age", "30")).toThrow("Invalid age");
    });

    test("error: height invalid (range/type)", () => {
      expect(() => flow.updateProfileField("heightCm", 79)).toThrow("Invalid height");
      expect(() => flow.updateProfileField("heightCm", 251)).toThrow("Invalid height");
      expect(() => flow.updateProfileField("heightCm", NaN)).toThrow("Invalid height");
      expect(() => flow.updateProfileField("heightCm", "180")).toThrow("Invalid height");
    });

    test("error: weight invalid (range/type)", () => {
      expect(() => flow.updateProfileField("weightKg", 19)).toThrow("Invalid weight");
      expect(() => flow.updateProfileField("weightKg", 301)).toThrow("Invalid weight");
      expect(() => flow.updateProfileField("weightKg", NaN)).toThrow("Invalid weight");
      expect(() => flow.updateProfileField("weightKg", "70")).toThrow("Invalid weight");
    });

    test("error: allergies phải là mảng", () => {
      expect(() => flow.updateProfileField("allergies", "x")).toThrow("Invalid allergies");
    });
  });

  describe("validateProfile()", () => {
    test("happy: profile đầy đủ → []", () => {
      flow.updateProfileField("age", 30);
      flow.updateProfileField("heightCm", 175);
      flow.updateProfileField("weightKg", 70);
      flow.updateProfileField("goal", "lose_weight");
      const errs = flow.validateProfile();
      expect(errs).toEqual([]);
    });

    test("error/state: thiếu từng field trả key tương ứng", () => {
      // ban đầu thiếu cả 4
      expect(flow.validateProfile()).toEqual(["age", "heightCm", "weightKg", "goal"]);

      // điền dần để kiểm tra danh sách thiếu cập nhật đúng
      flow.updateProfileField("age", 30);
      expect(flow.validateProfile()).toEqual(["heightCm", "weightKg", "goal"]);
      flow.updateProfileField("heightCm", 175);
      expect(flow.validateProfile()).toEqual(["weightKg", "goal"]);
      flow.updateProfileField("weightKg", 70);
      expect(flow.validateProfile()).toEqual(["goal"]);
    });
  });

  describe("submitProfile()", () => {
    test("happy: chuyển collect_profile → ai_analysis và đánh dấu completed", () => {
      flow.updateProfileField("age", 30);
      flow.updateProfileField("heightCm", 175);
      flow.updateProfileField("weightKg", 70);
      flow.updateProfileField("goal", "lose_weight");

      const next = flow.submitProfile();
      expect(next.id).toBe("ai_analysis");
      // bước trước đã completed
      expect(flow.steps[0].status).toBe("completed");
      // current là ai_analysis
      expect(flow.getCurrentStep().id).toBe("ai_analysis");
      expect(flow.steps[1].status).toBe("pending");
    });

    test("error: profile thiếu → ném Invalid profile", () => {
      // thiếu goal
      flow.updateProfileField("age", 30);
      flow.updateProfileField("heightCm", 175);
      flow.updateProfileField("weightKg", 70);
      expect(() => flow.submitProfile()).toThrow(/Invalid profile:/);
    });

    // Tests bắt lỗi workflow/thiết kế
    test("WORKFLOW: gọi submitProfile lần 2 phải bị chặn (kỳ vọng)", () => {
      flow.updateProfileField("age", 30);
      flow.updateProfileField("heightCm", 175);
      flow.updateProfileField("weightKg", 70);
      flow.updateProfileField("goal", "lose_weight");
      flow.submitProfile(); // move to ai_analysis
      // Kỳ vọng: lần 2 phải ném lỗi 'Invalid step' (hiện tại sẽ FAIL — bug workflow)
      expect(() => flow.submitProfile()).toThrow("Invalid step");
    });

    test("WORKFLOW: không cho updateProfileField sau khi đã submitProfile (kỳ vọng)", () => {
      flow.updateProfileField("age", 30);
      flow.updateProfileField("heightCm", 175);
      flow.updateProfileField("weightKg", 70);
      flow.updateProfileField("goal", "lose_weight");
      flow.submitProfile();
      // Kỳ vọng: không cho phép cập nhật ở bước khác collect_profile (hiện tại sẽ FAIL)
      expect(() => flow.updateProfileField("age", 31)).toThrow("Invalid step");
    });
  });
});
