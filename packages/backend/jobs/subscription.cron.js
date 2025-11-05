// packages/backend/jobs/subscription.cron.js
import cron from 'node-cron';
import { Op } from 'sequelize';
import User from '../models/user.model.js';

export function scheduleSubscriptionExpiryJob() {
  // Run at 00:01 daily
  cron.schedule('1 0 * * *', async () => {
    try {
      await User.update(
        { user_type: 'free', user_exp_date: null },
        {
          where: {
            user_type: 'premium',
            user_exp_date: { [Op.lt]: new Date() },
          },
        }
      );
    } catch (error) {
      console.error('Error in expired subscription cron job:', error);
    }
  });
}

