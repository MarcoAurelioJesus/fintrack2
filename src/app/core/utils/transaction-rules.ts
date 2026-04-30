import { Transaction } from '../models';

export function getEffectiveTransactionDate(transaction: Transaction): Date {
  if (transaction.isScheduled && transaction.scheduledDate) {
    return new Date(transaction.scheduledDate);
  }
  return new Date(transaction.date);
}

export function isTransactionEffective(
  transaction: Transaction,
  referenceDate: Date
): boolean {
  if (!transaction.isScheduled) {
    return true;
  }
  return getEffectiveTransactionDate(transaction) <= referenceDate;
}
