import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionsComponent } from './transactions.component';
import { categoryFactory, transactionFactory } from '../../../test/factories';
import { APP_I18N } from '@core/i18n/app-labels';

describe('TransactionsComponent', () => {
  const messageService = {
    add: vi.fn(),
  };

  const transactionService = {
    transactions$: of([]),
    getTransactions: vi.fn(() => of([])),
    deleteTransaction: vi.fn(() => of(void 0)),
  };

  const categoryService = {
    categories$: of([categoryFactory()]),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    messageService.add.mockReset();
    transactionService.getTransactions.mockReset();
    transactionService.getTransactions.mockReturnValue(of([]));
    transactionService.deleteTransaction.mockReset();
    transactionService.deleteTransaction.mockReturnValue(of(void 0));
  });

  it('opens and closes the form and details panels', () => {
    const component = new TransactionsComponent(
      transactionService as never,
      categoryService as never,
      messageService as never
    );
    const transaction = transactionFactory({ id: 'tx-1' });

    component.openForm(transaction);
    expect(component.displayForm).toBe(true);
    expect(component.selectedTransaction).toEqual(transaction);

    component.closeForm();
    expect(component.displayForm).toBe(false);
    expect(component.selectedTransaction).toBeNull();

    component.openDetails(transaction);
    expect(component.displayDetails).toBe(true);
    expect(component.transactionDetails).toEqual(transaction);

    component.closeDetails();
    expect(component.displayDetails).toBe(false);
    expect(component.transactionDetails).toBeNull();
  });

  it('applies and clears filters through the transaction service', () => {
    const component = new TransactionsComponent(
      transactionService as never,
      categoryService as never,
      messageService as never
    );
    component.filterCategoryId = 'category-2';
    component.filterType = 'entrada';

    component.applyFilters();
    expect(transactionService.getTransactions).toHaveBeenCalledWith({
      categoryId: 'category-2',
      type: 'entrada',
    });

    component.clearFilters();
    expect(component.filterCategoryId).toBeNull();
    expect(component.filterType).toBeNull();
    expect(transactionService.getTransactions).toHaveBeenLastCalledWith();
  });

  it('deletes a transaction after confirmation and shows feedback', () => {
    const component = new TransactionsComponent(
      transactionService as never,
      categoryService as never,
      messageService as never
    );
    vi.stubGlobal('confirm', vi.fn(() => true));

    component.deleteTransaction(transactionFactory({ id: 'tx-delete' }));

    expect(transactionService.deleteTransaction).toHaveBeenCalledWith('tx-delete');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
        detail: APP_I18N.transactions.deleteSuccessDetail,
      })
    );
  });

  it('formats values and returns the proper type classes', () => {
    const component = new TransactionsComponent(
      transactionService as never,
      categoryService as never,
      messageService as never
    );
    const expenseType = component.typeOptions[1].value as string;

    expect(component.formatCurrency(123.45)).toBe('R$ 123,45');
    expect(component.formatDate('2026-04-10T00:00:00.000Z')).toBeTruthy();
    expect(component.getTypeClass('entrada')).toMatchObject({ 'text-success-500': true });
    expect(component.getTypeClass(expenseType)).toMatchObject({ 'text-danger-500': true });
  });
});
