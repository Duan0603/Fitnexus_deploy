import { ONBOARDING_FLOW } from "../config/onboardingFlow";

export default function OnboardingProgress({ currentKey }) {
  const total = ONBOARDING_FLOW.length;
  const index = ONBOARDING_FLOW.indexOf(currentKey);
  const stepNum = index >= 0 ? index + 1 : 1;
  const percent = (stepNum / total) * 100;

  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="text-xs font-medium text-blue-600">
        Bước {stepNum}/{total}
      </div>
      <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}