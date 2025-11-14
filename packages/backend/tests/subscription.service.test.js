import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureActiveSubscription,
  isPremiumExpired,
} from '../services/subscription.service.js';

test('isPremiumExpired only flags premium users whose expiry passed', () => {
  const now = new Date('2025-01-01T00:00:00Z');
  assert.equal(
    isPremiumExpired({ user_type: 'premium', user_exp_date: '2024-12-31T23:59:00Z' }, now),
    true
  );
  assert.equal(
    isPremiumExpired({ user_type: 'premium', user_exp_date: '2025-01-02T00:00:00Z' }, now),
    false
  );
  assert.equal(
    isPremiumExpired({ user_type: 'free', user_exp_date: '2024-01-01T00:00:00Z' }, now),
    false
  );
});

test('ensureActiveSubscription keeps valid premium access untouched', async () => {
  let saveCalled = false;
  const user = {
    plan: 'PREMIUM',
    user_type: 'premium',
    user_exp_date: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    set() {},
    async save() {
      saveCalled = true;
    },
  };
  await ensureActiveSubscription(user, { now: new Date() });
  assert.equal(user.plan, 'PREMIUM');
  assert.equal(user.user_type, 'premium');
  assert.ok(user.user_exp_date);
  assert.equal(saveCalled, false);
});

test('ensureActiveSubscription downgrades expired premium users', async () => {
  let savedFields = null;
  const user = {
    plan: 'PREMIUM',
    user_type: 'premium',
    user_exp_date: new Date(Date.now() - 60 * 1000).toISOString(),
    set(patch) {
      Object.assign(this, patch);
    },
    async save({ fields }) {
      savedFields = fields;
    },
  };
  await ensureActiveSubscription(user, { now: new Date() });
  assert.equal(user.plan, 'FREE');
  assert.equal(user.user_type, 'free');
  assert.equal(user.user_exp_date, null);
  assert.deepEqual(savedFields, ['plan', 'user_type', 'user_exp_date']);
});
