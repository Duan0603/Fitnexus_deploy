// packages/frontend/src/features/onboarding/OnboardingManager.js
// Nutrition AI Onboarding — Single Core Feature
// ESM module (frontend uses "type":"module")

class OnboardingManager {
  constructor(userId) {
    this.userId = userId;
    this.steps = [
      { id: 'collect_profile', status: 'pending' },
      { id: 'ai_analysis', status: 'pending' },
      { id: 'review_plan', status: 'pending' },
      { id: 'done', status: 'pending' }
    ];
    this.currentIndex = 0;
    this.profile = {
      age: null,
      heightCm: null,
      weightKg: null,
      goal: null,
      allergies: []
    };
    this.plan = null;
  }

  start() {
    if (!this.userId) throw new Error('Missing user');
    return this.getCurrentStep();
  }

  getCurrentStep() {
    return this.steps[this.currentIndex] || null;
  }

  updateProfileField(field, value) {
    const allowed = ['age', 'heightCm', 'weightKg', 'goal', 'allergies'];
    if (!allowed.includes(field)) throw new Error('Invalid field');

    if (field === 'age') {
      if (typeof value !== 'number' || Number.isNaN(value)) throw new Error('Invalid age');
      if (value < 5 || value > 120) throw new Error('Invalid age');
    }

    if (field === 'heightCm') {
      if (typeof value !== 'number' || Number.isNaN(value)) throw new Error('Invalid height');
      if (value < 80 || value > 250) throw new Error('Invalid height');
    }

    if (field === 'weightKg') {
      if (typeof value !== 'number' || Number.isNaN(value)) throw new Error('Invalid weight');
      if (value < 20 || value > 300) throw new Error('Invalid weight');
    }

    if (field === 'allergies') {
      if (!Array.isArray(value)) throw new Error('Invalid allergies');
    }

    // goal: chấp nhận chuỗi truthy bất kỳ (validate chi tiết ở tầng khác nếu cần)
    this.profile[field] = value;
    return true;
  }

  validateProfile() {
    const errors = [];
    if (this.profile.age == null) errors.push('age');
    if (this.profile.heightCm == null) errors.push('heightCm');
    if (this.profile.weightKg == null) errors.push('weightKg');
    if (!this.profile.goal) errors.push('goal');
    return errors;
  }

  submitProfile() {
    const errors = this.validateProfile();
    if (errors.length) throw new Error('Invalid profile: ' + errors.join(','));
    this.steps[this.currentIndex].status = 'completed';
    this.currentIndex += 1; // ai_analysis
    return this.getCurrentStep();
  }

  async requestAiPlan(NutritionAIService) {
    if (this.getCurrentStep()?.id !== 'ai_analysis') throw new Error('Invalid step');
    const plan = await NutritionAIService.analyzeProfile(this.profile);
    if (!plan || !plan.id) throw new Error('Invalid plan');
    this.plan = plan;
    this.steps[this.currentIndex].status = 'completed';
    this.currentIndex += 1; // review_plan
    return plan;
  }

  approvePlan(planId) {
    if (this.getCurrentStep()?.id !== 'review_plan') throw new Error('Invalid step');
    if (!this.plan || this.plan.id !== planId) throw new Error('Plan mismatch');
    this.steps[this.currentIndex].status = 'completed';
    this.currentIndex += 1; // done
    return this.getCurrentStep();
  }
}

export default OnboardingManager;
