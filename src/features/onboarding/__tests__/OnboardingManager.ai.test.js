// packages/frontend/src/features/onboarding/__tests__/OnboardingManager.ai.test.js
// Run: npm test  (configured to use ESM)
import { jest } from "@jest/globals";
import OnboardingManager from "../OnboardingManager.js";

const buildValidFlow = () => {
  const flow = new OnboardingManager("u1");
  flow.start();
  flow.updateProfileField("age", 30);
  flow.updateProfileField("heightCm", 175);
  flow.updateProfileField("weightKg", 70);
  flow.updateProfileField("goal", "lose_weight");
  flow.submitProfile(); // move to ai_analysis
  return flow;
};

describe("OnboardingManager — AI interactions", () => {
  describe("requestAiPlan()", () => {
    test("happy: gọi analyzeProfile, lưu plan, chuyển review_plan", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = {
        analyzeProfile: jest.fn().mockResolvedValue({ id: "plan1", kcal: 2000 }),
      };
      const plan = await flow.requestAiPlan(NutritionAIService);
      expect(plan).toEqual({ id: "plan1", kcal: 2000 });
      expect(flow.plan).toEqual({ id: "plan1", kcal: 2000 });
      expect(flow.getCurrentStep().id).toBe("review_plan");
      expect(NutritionAIService.analyzeProfile).toHaveBeenCalledWith({
        age: 30,
        heightCm: 175,
        weightKg: 70,
        goal: "lose_weight",
        allergies: [],
      });
    });

    test("error: sai bước (chưa submitProfile) → Invalid step", async () => {
      const flow = new OnboardingManager("u1");
      flow.start();
      const NutritionAIService = { analyzeProfile: jest.fn() };
      await expect(flow.requestAiPlan(NutritionAIService)).rejects.toThrow("Invalid step");
    });

    test("error: invalid plan (null)", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = { analyzeProfile: jest.fn().mockResolvedValue(null) };
      await expect(flow.requestAiPlan(NutritionAIService)).rejects.toThrow("Invalid plan");
    });

    test("error: invalid plan (missing id)", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = { analyzeProfile: jest.fn().mockResolvedValue({}) };
      await expect(flow.requestAiPlan(NutritionAIService)).rejects.toThrow("Invalid plan");
    });

    test("error: network reject được propagate", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = { analyzeProfile: jest.fn().mockRejectedValue(new Error("Network")) };
      await expect(flow.requestAiPlan(NutritionAIService)).rejects.toThrow("Network");
    });
  });

  describe("approvePlan()", () => {
    test("happy: planId khớp → chuyển done", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = {
        analyzeProfile: jest.fn().mockResolvedValue({ id: "planX", kcal: 2100 }),
      };
      await flow.requestAiPlan(NutritionAIService);
      const step = flow.approvePlan("planX");
      expect(step.id).toBe("done");
      expect(flow.getCurrentStep().id).toBe("done");
    });

    test("error: sai bước → Invalid step", () => {
      const flow = new OnboardingManager("u1");
      flow.start();
      expect(() => flow.approvePlan("p1")).toThrow("Invalid step");
    });

    test("error: Plan mismatch khi không có plan hoặc id không khớp", async () => {
      const flow = buildValidFlow();
      const NutritionAIService = { analyzeProfile: jest.fn().mockResolvedValue({ id: "plan1" }) };
      await flow.requestAiPlan(NutritionAIService);
      expect(() => flow.approvePlan("other")).toThrow("Plan mismatch");
    });
  });
});
