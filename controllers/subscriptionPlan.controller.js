// packages/backend/controllers/subscriptionPlan.controller.js
import SubscriptionPlan from '../models/subscription.plan.model.js';

export async function getActivePlans(req, res) {
  try {
    const plans = await SubscriptionPlan.findAll({ where: { is_active: true }, order: [['price', 'ASC']] });
    return res.json({ success: true, data: plans });
  } catch (err) {
    console.error('getActivePlans error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}

