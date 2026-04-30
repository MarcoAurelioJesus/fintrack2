export function getEffectiveTransactionDate(row) {
  const isScheduled =
    row.is_scheduled === true || String(row.is_scheduled).toLowerCase() === 'true';
  if (isScheduled && row.scheduled_date) {
    return new Date(row.scheduled_date);
  }
  return new Date(row.date);
}

export function isTransactionEffective(row, referenceDate) {
  return getEffectiveTransactionDate(row) <= referenceDate;
}
