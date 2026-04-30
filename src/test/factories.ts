import { Category, DashboardStats, Transaction } from '../app/core/models';

export function categoryFactory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    name: 'Salario',
    color: '#22c55e',
    isFavorite: true,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

export function transactionFactory(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'transaction-1',
    description: 'Recebimento',
    value: 100,
    type: 'entrada',
    categoryId: 'category-1',
    category: categoryFactory(),
    date: new Date('2026-04-10T00:00:00.000Z'),
    scheduledDate: null,
    isScheduled: false,
    notes: '',
    createdAt: new Date('2026-04-10T00:00:00.000Z'),
    updatedAt: new Date('2026-04-10T00:00:00.000Z'),
    ...overrides,
  };
}

export function dashboardStatsFactory(
  overrides: Partial<DashboardStats> = {}
): DashboardStats {
  return {
    currentBalance: 1000,
    monthlyIncome: 1500,
    monthlyExpense: 500,
    incomeCount: 2,
    expenseCount: 1,
    byCategory: [],
    monthlyEvolution: [],
    ...overrides,
  };
}

export class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
