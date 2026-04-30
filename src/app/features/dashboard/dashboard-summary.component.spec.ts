import { describe, expect, it, vi } from 'vitest';
import { DashboardSummaryComponent } from './dashboard-summary.component';
import { dashboardStatsFactory } from '../../../test/factories';

describe('DashboardSummaryComponent', () => {
  it('emits a refresh event when requested', () => {
    const component = new DashboardSummaryComponent();
    const emitSpy = vi.spyOn(component.refreshRequested, 'emit');

    component.onRefresh();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('returns the correct style classes for positive and negative balances', () => {
    const component = new DashboardSummaryComponent();

    expect(component.getBalanceClass(10)).toMatchObject({
      'text-success-500': true,
      'bg-success-500/10': true,
      'border-success-500/30': true,
    });
    expect(component.getBalanceClass(-10)).toMatchObject({
      'text-danger-500': true,
      'bg-danger-500/10': true,
      'border-danger-500/30': true,
    });
  });

  it('formats values as BRL currency', () => {
    const component = new DashboardSummaryComponent();
    component.stats = dashboardStatsFactory();

    expect(component.formatCurrency(1234.56)).toBe('R$ 1.234,56');
  });
});
