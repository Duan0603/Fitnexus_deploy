// packages/backend/jobs/subscription.cron.js
import cron from 'node-cron';
import { Op } from 'sequelize';
import User from '../models/user.model.js';
import { notifyUserOnce } from '../services/notification.service.js';

export function scheduleSubscriptionExpiryJob() {
  // Run at 00:01 daily
  cron.schedule('1 0 * * *', async () => {
    try {
      const now = new Date();
      const soon = new Date(now);
      soon.setDate(soon.getDate() + 3);

      const expiringSoon = await User.findAll({
        where: {
          user_type: 'premium',
          user_exp_date: {
            [Op.gt]: now,
            [Op.lte]: soon,
          },
        },
        attributes: ['user_id', 'user_exp_date'],
      });

      await Promise.all(
        expiringSoon.map((user) =>
          notifyUserOnce(
            user.user_id,
            {
              type: 'premium_expiry',
              title: 'Premium của bạn sẽ hết hạn trong 3 ngày',
              body: 'Gia hạn ngay để giữ quyền lợi.',
              metadata: { expiresAt: user.user_exp_date },
            },
            24
          )
        )
      );

      await User.update(
        { plan: 'FREE', user_type: 'free', user_exp_date: null },
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

