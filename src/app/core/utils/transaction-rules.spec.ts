import { describe, expect, it } from 'vitest';
import {
  getEffectiveTransactionDate,
  isTransactionEffective,
} from './transaction-rules';
import { Transaction } from '../models';

function transactionFactory(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't-1',
    description: 'Teste',
    value: 100,
    type: 'entrada',
    categoryId: 'c-1',
    date: new Date('2026-04-10T10:00:00Z'),
    isScheduled: false,
    createdAt: new Date('2026-04-10T10:00:00Z'),
    updatedAt: new Date('2026-04-10T10:00:00Z'),
    ...overrides,
  };
}

describe('transaction-rules', () => {
  it('uses scheduledDate as effective date when scheduled', () => {
    const transaction = transactionFactory({
      isScheduled: true,
      scheduledDate: new Date('2026-05-20T10:00:00Z'),
      date: new Date('2026-04-10T10:00:00Z'),
    });

    const effectiveDate = getEffectiveTransactionDate(transaction);

    expect(effectiveDate.toISOString()).toContain('2026-05-20');
  });

  it('does not count future scheduled transactions', () => {
    const referenceDate = new Date('2026-05-01T00:00:00Z');
    const transaction = transactionFactory({
      isScheduled: true,
      scheduledDate: new Date('2026-05-20T10:00:00Z'),
    });

    const effective = isTransactionEffective(transaction, referenceDate);

    expect(effective).toBe(false);
  });

  it('counts scheduled transactions when date is reached', () => {
    const referenceDate = new Date('2026-05-21T00:00:00Z');
    const transaction = transactionFactory({
      isScheduled: true,
      scheduledDate: new Date('2026-05-20T10:00:00Z'),
    });

    const effective = isTransactionEffective(transaction, referenceDate);

    expect(effective).toBe(true);
  });
});
