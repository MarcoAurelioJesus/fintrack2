import { BehaviorSubject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardComponent } from './dashboard.component';
import { categoryFactory, dashboardStatsFactory, transactionFactory } from '../../../test/factories';
import { APP_I18N } from '@core/i18n/app-labels';

describe('DashboardComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes chart data and category options from service streams', () => {
    const transactions$ = new BehaviorSubject([
      transactionFactory({
        id: 'march',
        value: 100,
        type: 'entrada',
        date: new Date('2026-03-10T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'april',
        value: 40,
        type: 'saida',
        date: new Date('2026-04-10T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'future',
        value: 999,
        type: 'entrada',
        isScheduled: true,
        scheduledDate: new Date('2026-04-20T00:00:00.000Z'),
      }),
    ]);
    const categories$ = new BehaviorSubject([
      categoryFactory({ id: 'category-1', name: 'Salario' }),
      categoryFactory({ id: 'category-2', name: 'Mercado' }),
    ]);
    const component = new DashboardComponent(
      {
        stats$: of(dashboardStatsFactory()),
        refreshStats: vi.fn(),
      } as never,
      {
        transactions$,
      } as never,
      {
        categories$,
      } as never
    );

    component.ngOnInit();

    const dataset = (component.chartData.datasets as Array<Record<string, unknown>>)[0];
    expect(component.categoryOptions).toHaveLength(2);
    expect(component.chartData.labels).toHaveLength(6);
    expect(dataset.data).toEqual([0, 0, 0, 0, 100, -40]);
    expect(dataset.label).toBe(APP_I18N.dashboard.chartDatasetLabel);
    expect(component.chartOptions).toMatchObject({
      responsive: true,
    });
  });

  it('rebuilds the chart using the selected category filter', () => {
    const transactions$ = new BehaviorSubject([
      transactionFactory({
        id: 'cat-1-income',
        value: 120,
        type: 'entrada',
        categoryId: 'category-1',
        date: new Date('2026-04-10T00:00:00.000Z'),
      }),
      transactionFactory({
        id: 'cat-2-expense',
        value: 50,
        type: 'saida',
        categoryId: 'category-2',
        date: new Date('2026-04-11T00:00:00.000Z'),
      }),
    ]);
    const component = new DashboardComponent(
      {
        stats$: of(dashboardStatsFactory()),
        refreshStats: vi.fn(),
      } as never,
      {
        transactions$,
      } as never,
      {
        categories$: new BehaviorSubject([
          categoryFactory({ id: 'category-1' }),
          categoryFactory({ id: 'category-2' }),
        ]),
      } as never
    );
    component.ngOnInit();

    component.selectedCategoryId = 'category-1';
    component.onCategoryFilterChange();

    const dataset = (component.chartData.datasets as Array<Record<string, unknown>>)[0];
    expect(dataset.data).toEqual([0, 0, 0, 0, 0, 120]);
  });

  it('refreshes stats and clears the loading state after the timeout', () => {
    const refreshStats = vi.fn();
    const component = new DashboardComponent(
      {
        stats$: of(dashboardStatsFactory()),
        refreshStats,
      } as never,
      {
        transactions$: new BehaviorSubject([]),
      } as never,
      {
        categories$: new BehaviorSubject([]),
      } as never
    );

    component.refreshStats();
    expect(component.isLoading).toBe(true);
    expect(refreshStats).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(500);
    expect(component.isLoading).toBe(false);
  });
});
