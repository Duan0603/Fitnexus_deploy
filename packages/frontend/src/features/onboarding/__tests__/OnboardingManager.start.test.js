// packages/frontend/src/features/onboarding/__tests__/OnboardingManager.start.test.js
// Jest ESM: run with NODE_OPTIONS=--experimental-vm-modules or set up jest.config.cjs

import OnboardingManager from "../OnboardingManager.js";

describe("OnboardingManager.start()", () => {
  test("happy: trả về collect_profile khi userId hợp lệ", () => {
    const flow = new OnboardingManager("u1");
    const step = flow.start();
    expect(step).toBeTruthy();
    expect(step.id).toBe("collect_profile");
    expect(step.status).toBe("pending");
  });

  test("idempotent: gọi start() nhiều lần không đổi state", () => {
    const flow = new OnboardingManager("u1");
    const s1 = flow.start();
    const s2 = flow.start();
    expect(s2.id).toBe("collect_profile");
    expect(flow.currentIndex).toBe(0);
    expect(s1).toBe(flow.getCurrentStep()); // vẫn cùng tham chiếu bước hiện tại
  });

  test("invariants: có 4 bước đúng thứ tự và đều pending", () => {
    const flow = new OnboardingManager("u1");
    flow.start();
    const ids = flow.steps.map((s) => s.id);
    expect(ids).toEqual([
      "collect_profile",
      "ai_analysis",
      "review_plan",
      "done",
    ]);
    expect(flow.steps.every((s) => s.status === "pending")).toBe(true);
  });

  test("init state: profile mặc định và plan null", () => {
    const flow = new OnboardingManager("u1");
    flow.start();
    expect(flow.profile).toEqual({
      age: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      allergies: [],
    });
    expect(flow.plan).toBeNull();
  });

  test("error: thiếu userId → Missing user", () => {
    const flow = new OnboardingManager(undefined);
    expect(() => flow.start()).toThrow("Missing user");
  });

  test("multi-instance: 2 instance độc lập state", () => {
    const a = new OnboardingManager("u1");
    const b = new OnboardingManager("u2");
    expect(a.start().id).toBe("collect_profile");
    expect(b.start().id).toBe("collect_profile");
    a.updateProfileField("age", 30);
    expect(b.profile.age).toBeNull();
  });

  // Tests bắt lỗi workflow/thiết kế
  test("IMMUTABILITY: mutate object trả về từ getCurrentStep không được ảnh hưởng nội bộ (kỳ vọng)", () => {
    const flow = new OnboardingManager("u1");
    const step = flow.start();
    // cố tình mutate đối tượng bên ngoài
    step.status = "completed";
    // Kỳ vọng: nội bộ vẫn pending (hiện tại sẽ FAIL vì trả tham chiếu trực tiếp)
    expect(flow.steps[0].status).toBe("pending");
  });
});
