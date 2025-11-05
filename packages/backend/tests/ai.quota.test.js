import test from 'node:test';
import assert from 'node:assert/strict';
import { __internals } from '../middleware/ai.quota.js';

test('canonicalFeatureKey normalizes strings', () => {
  const { canonicalFeatureKey } = __internals;
  assert.equal(canonicalFeatureKey(' Nutrition Plan  '), 'nutrition_plan');
  assert.equal(canonicalFeatureKey('Trainer/Image-Analyze'), 'trainer_image_analyze');
  assert.equal(canonicalFeatureKey('  __weird__--Key!!  '), 'weird_key');
});

test('getIsoWeekKey returns ISO-like format', () => {
  const { getIsoWeekKey } = __internals;
  const key = getIsoWeekKey(new Date('2025-10-28T00:00:00Z'));
  assert.match(key, /^\d{4}-W\d{2}$/);
});

test('anonKeyFromReq hashes ip + ua', () => {
  const { anonKeyFromReq } = __internals;
  const req = { ip: '127.0.0.1', get: (h) => (h.toLowerCase() === 'user-agent' ? 'test-agent' : undefined) };
  const a = anonKeyFromReq(req);
  const b = anonKeyFromReq(req);
  assert.equal(a.length, 64);
  assert.equal(a, b, 'same input should produce same hash');
});

