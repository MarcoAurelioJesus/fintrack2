import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardService } from './dashboard.service';
import { categoryFactory, transactionFactory } from '../../../test/factories';

describe('DashboardService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates balances, counts and category distribution from effective transactions', async () => {
    const categories = [
      categoryFactory({ id: 'food', name: 'Alimentacao', color: '#f97316' }),
      categoryFactory({ id: 'salary', name: 'Salario', color: '#22c55e' }),
    ];
    const transactions = [
      transactionFactory({
        id: 'income',
        type: 'entrada',
        value: 4000,
        categoryId: 'salary',
        date: new Date('2026-04-05T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'expense',
        type: 'saida',
        value: 500,
        categoryId: 'food',
        date: new Date('2026-04-08T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'future-scheduled',
        type: 'entrada',
        value: 1000,
        isScheduled: true,
        scheduledDate: new Date('2026-04-20T00:00:00.000Z'),
      }),
    ];

    const transactionStream = new BehaviorSubject(transactions);
    const categoryStream = new BehaviorSubject(categories);
    const service = new DashboardService(
      {
        getTransactions: () => transactionStream.asObservable(),
      } as never,
      {
        getCategories: () => categoryStream.asObservable(),
      } as never
    );

    const stats = await firstValueFrom(service.getStats());

    expect(stats.currentBalance).toBe(3500);
    expect(stats.monthlyIncome).toBe(4000);
    expect(stats.monthlyExpense).toBe(500);
    expect(stats.incomeCount).toBe(1);
    expect(stats.expenseCount).toBe(1);
    expect(stats.byCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          categoryId: 'salary',
          total: 4000,
          percentage: expect.any(Number),
        }),
        expect.objectContaining({
          categoryId: 'food',
          total: 500,
          percentage: expect.any(Number),
        }),
      ])
    );
  });

  it('builds six months of evolution using effective dates', async () => {
    const transactions = [
      transactionFactory({
        id: 'march-income',
        value: 2000,
        type: 'entrada',
        date: new Date('2026-03-10T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'april-expense',
        value: 300,
        type: 'saida',
        date: new Date('2026-04-11T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'scheduled-april',
        value: 150,
        type: 'entrada',
        isScheduled: true,
        date: new Date('2026-03-25T00:00:00.000Z'),
        scheduledDate: new Date('2026-04-12T00:00:00.000Z'),
      }),
    ];

    const service = new DashboardService(
      {
        getTransactions: () => new BehaviorSubject(transactions).asObservable(),
      } as never,
      {
        getCategories: () => new BehaviorSubject([]).asObservable(),
      } as never
    );

    const stats = await firstValueFrom(service.getStats());
    const april = stats.monthlyEvolution.at(-1);
    const march = stats.monthlyEvolution.at(-2);

    expect(stats.monthlyEvolution).toHaveLength(6);
    expect(march).toMatchObject({
      income: 2000,
      expense: 0,
      balance: 2000,
    });
    expect(april).toMatchObject({
      income: 150,
      expense: 300,
      balance: -150,
    });
  });

  it('re-subscribes to underlying streams when refreshStats is called', async () => {
    const transactionStream = new BehaviorSubject([transactionFactory({ value: 100 })]);
    const categoryStream = new BehaviorSubject([categoryFactory()]);
    const transactionService = {
      getTransactions: vi.fn(() => transactionStream.asObservable()),
    };
    const categoryService = {
      getCategories: vi.fn(() => categoryStream.asObservable()),
    };

    const service = new DashboardService(
      transactionService as never,
      categoryService as never
    );

    await firstValueFrom(service.getStats());
    service.refreshStats();

    expect(transactionService.getTransactions).toHaveBeenCalledTimes(2);
    expect(categoryService.getCategories).toHaveBeenCalledTimes(2);
  });
});
