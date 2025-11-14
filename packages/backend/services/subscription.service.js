// packages/backend/services/subscription.service.js
import User from "../models/user.model.js";

function normalizeType(user) {
  const type =
    user?.user_type ||
    (typeof user?.get === "function" ? user.get("user_type") : null) ||
    null;
  if (type) return String(type).toLowerCase();
  const plan =
    user?.plan || (typeof user?.get === "function" ? user.get("plan") : null);
  if (!plan) return "free";
  return String(plan).toLowerCase();
}

function extractExpiry(user) {
  const raw =
    user?.user_exp_date ||
    (typeof user?.get === "function" ? user.get("user_exp_date") : null);
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function isPremiumUser(user) {
  return normalizeType(user) === "premium";
}

export function isPremiumExpired(user, now = new Date()) {
  if (!user || !isPremiumUser(user)) return false;
  const exp = extractExpiry(user);
  if (!exp) return false;
  return exp.getTime() <= now.getTime();
}

async function persistDowngrade(user, options = {}) {
  const fields = ["plan", "user_type", "user_exp_date"];
  if (typeof user?.save === "function" && options.save !== false) {
    await user.save({ fields });
    return;
  }
  const userId =
    user?.user_id ||
    user?.id ||
    (typeof user?.get === "function" ? user.get("user_id") : null);
  if (!userId) return;
  await User.update(
    {
      plan: "FREE",
      user_type: "free",
      user_exp_date: null,
    },
    { where: { user_id: userId } }
  );
}

export async function ensureActiveSubscription(user, options = {}) {
  if (!user) return user;
  if (!isPremiumUser(user)) return user;
  if (!isPremiumExpired(user, options.now || new Date())) return user;
  // Nếu tới đây nghĩa là user đang premium nhưng đã hết hạn
  if (typeof user.set === "function") {
    user.set({
      plan: "FREE",
      user_type: "free",
      user_exp_date: null,
    });
  } else {
    user.plan = "FREE";
    user.user_type = "free";
    user.user_exp_date = null;
  }
  await persistDowngrade(user, options);
  return user;
}
