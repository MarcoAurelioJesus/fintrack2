import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionFormComponent } from './transaction-form.component';
import { transactionFactory } from '../../../test/factories';
import { APP_I18N } from '@core/i18n/app-labels';

describe('TransactionFormComponent', () => {
  const transactionService = {
    createTransaction: vi.fn(),
    updateTransaction: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    transactionService.createTransaction.mockReset();
    transactionService.updateTransaction.mockReset();
  });

  it('requires a scheduled date only when scheduling is enabled', () => {
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );
    component.ngOnInit();

    component.form.get('isScheduled')?.setValue(true);
    expect(component.form.get('scheduledDate')?.hasError('required')).toBe(true);

    component.form.get('scheduledDate')?.setValue(new Date('2026-05-10T00:00:00.000Z'));
    expect(component.form.get('scheduledDate')?.valid).toBe(true);

    component.form.get('isScheduled')?.setValue(false);
    expect(component.form.get('scheduledDate')?.value).toBeNull();
  });

  it('populates the form when editing a transaction', () => {
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );
    component.transaction = transactionFactory({
      id: 'tx-edit',
      description: 'Cartao',
      value: 600,
      notes: 'Parcelado',
      isScheduled: true,
      scheduledDate: new Date('2026-05-01T00:00:00.000Z'),
    });

    component.ngOnInit();

    expect(component.form.value).toMatchObject({
      description: 'Cartao',
      value: 600,
      isScheduled: true,
      notes: 'Parcelado',
    });
    expect(component.form.get('scheduledDate')?.value).toBeInstanceOf(Date);
  });

  it('marks invalid controls as touched instead of submitting', () => {
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );
    component.ngOnInit();

    component.onSubmit();

    expect(component.form.get('description')?.touched).toBe(true);
    expect(transactionService.createTransaction).not.toHaveBeenCalled();
  });

  it('uses the centralized labels for transaction types', () => {
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );

    expect(component.typeOptions).toEqual([
      expect.objectContaining({ label: APP_I18N.transactions.typeOptions.income }),
      expect.objectContaining({ label: APP_I18N.transactions.typeOptions.expense }),
    ]);
  });

  it('creates a transaction and emits the saved value', () => {
    const created = transactionFactory({ id: 'created-tx', description: 'Mercado' });
    transactionService.createTransaction.mockReturnValue(of(created));
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );
    const emitSpy = vi.spyOn(component.saved, 'emit');
    component.ngOnInit();
    component.form.patchValue({
      description: 'Mercado',
      value: 150,
      type: 'entrada',
      categoryId: 'category-1',
      date: new Date('2026-04-20T00:00:00.000Z'),
      isScheduled: false,
      notes: 'Sem observacoes',
    });

    component.onSubmit();

    expect(transactionService.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Mercado',
        value: 150,
        categoryId: 'category-1',
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(created);
  });

  it('updates an existing transaction and emits the result', () => {
    const updated = transactionFactory({ id: 'tx-edit', description: 'Salario atualizado' });
    transactionService.updateTransaction.mockReturnValue(of(updated));
    const component = new TransactionFormComponent(
      new FormBuilder(),
      transactionService as never
    );
    component.transaction = transactionFactory({ id: 'tx-edit', description: 'Salario' });
    const emitSpy = vi.spyOn(component.saved, 'emit');

    component.ngOnInit();
    component.form.patchValue({
      description: 'Salario atualizado',
      value: 5000,
      type: 'entrada',
      categoryId: 'category-1',
      date: new Date('2026-04-01T00:00:00.000Z'),
      isScheduled: false,
      notes: 'Ajuste',
    });
    component.onSubmit();

    expect(transactionService.updateTransaction).toHaveBeenCalledWith(
      'tx-edit',
      expect.objectContaining({
        description: 'Salario atualizado',
        value: 5000,
        notes: 'Ajuste',
      })
    );
    expect(emitSpy).toHaveBeenCalledWith(updated);
  });
});
