import { describe, expect, it } from 'vitest';
import {
  getEffectiveTransactionDate,
  isTransactionEffective,
} from '../src/utils/transaction-rules.js';

function rowFactory(overrides = {}) {
  return {
    date: '2026-04-10T00:00:00.000Z',
    scheduled_date: null,
    is_scheduled: false,
    ...overrides,
  };
}

describe('backend transaction-rules', () => {
  it('uses the scheduled date when the transaction is scheduled', () => {
    const date = getEffectiveTransactionDate(
      rowFactory({
        is_scheduled: true,
        scheduled_date: '2026-05-20T00:00:00.000Z',
      })
    );

    expect(date.toISOString()).toContain('2026-05-20');
  });

  it('falls back to the original date when the transaction is not scheduled', () => {
    const date = getEffectiveTransactionDate(
      rowFactory({
        date: '2026-04-12T00:00:00.000Z',
      })
    );

    expect(date.toISOString()).toContain('2026-04-12');
  });

  it('treats future scheduled transactions as ineffective', () => {
    const effective = isTransactionEffective(
      rowFactory({
        is_scheduled: true,
        scheduled_date: '2026-05-20T00:00:00.000Z',
      }),
      new Date('2026-05-01T00:00:00.000Z')
    );

    expect(effective).toBe(false);
  });
});
