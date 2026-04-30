import { firstValueFrom, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionService } from './transaction.service';
import { MemoryStorage, transactionFactory } from '../../../test/factories';
import { Transaction } from '../models';

function createService(options: {
  storedTransactions?: Transaction[];
  getResponse?: unknown;
  postResponse?: unknown;
  putResponse?: unknown;
  deleteResponse?: unknown;
} = {}) {
  const http = {
    get: vi.fn((url?: string) =>
      options.getResponse instanceof Error
        ? throwError(() => options.getResponse)
        : of(options.getResponse ?? { success: true, data: options.storedTransactions ?? [] })
    ),
    post: vi.fn(() =>
      options.postResponse instanceof Error
        ? throwError(() => options.postResponse)
        : of(options.postResponse ?? { success: true, data: transactionFactory({ id: 'created' }) })
    ),
    put: vi.fn(() =>
      options.putResponse instanceof Error
        ? throwError(() => options.putResponse)
        : of(options.putResponse ?? { success: true, data: transactionFactory({ description: 'Atualizada' }) })
    ),
    delete: vi.fn(() =>
      options.deleteResponse instanceof Error
        ? throwError(() => options.deleteResponse)
        : of(options.deleteResponse ?? { success: true, data: null })
    ),
  };

  const storage = new MemoryStorage();
  if (options.storedTransactions) {
    storage.setItem('fintrack.transactions', JSON.stringify(options.storedTransactions));
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  const service = new TransactionService(http as never);
  return { service, http, storage };
}

describe('TransactionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds the query string when filters are provided', async () => {
    const apiTransactions = [transactionFactory({ id: 'filtered' })];
    const filters = {
      categoryId: 'category-9',
      type: 'entrada' as const,
      startDate: new Date('2026-04-01T00:00:00.000Z'),
      endDate: new Date('2026-04-30T00:00:00.000Z'),
      isScheduled: true,
    };
    const { service, http } = createService({
      getResponse: { success: true, data: apiTransactions },
    });

    const transactions = await firstValueFrom(service.getTransactions(filters));

    expect(http.get).toHaveBeenLastCalledWith(
      '/api/transactions?categoryId=category-9&type=entrada&startDate=2026-04-01T00%3A00%3A00.000Z&endDate=2026-04-30T00%3A00%3A00.000Z&isScheduled=true'
    );
    expect(transactions).toEqual(apiTransactions);
  });

  it('falls back to locally stored transactions when listing fails', async () => {
    const localTransactions = [transactionFactory({ id: 'local-1' })];
    const { service } = createService({
      storedTransactions: localTransactions,
      getResponse: new Error('api offline'),
    });

    const transactions = await firstValueFrom(service.getTransactions());

    expect(transactions).toMatchObject([
      expect.objectContaining({
        id: 'local-1',
        description: 'Recebimento',
        type: 'entrada',
        categoryId: 'category-1',
      }),
    ]);
  });

  it('creates a transaction locally when the API is unavailable', async () => {
    const localTransactions = [transactionFactory({ id: 'local-1' })];
    const { service } = createService({
      storedTransactions: localTransactions,
      getResponse: new Error('api offline'),
      postResponse: new Error('api offline'),
    });

    const created = await firstValueFrom(
      service.createTransaction({
        description: 'Conta de luz',
        value: 250,
        type: 'saida',
        categoryId: 'category-2',
        date: new Date('2026-04-15T00:00:00.000Z'),
        scheduledDate: null,
        isScheduled: false,
        notes: 'Abril',
      } as never)
    );
    const transactions = await firstValueFrom(service.transactions$);

    expect(created.id).toBeTruthy();
    expect(created.description).toBe('Conta de luz');
    expect(transactions).toHaveLength(2);
  });

  it('updates a stored transaction locally when the API update fails', async () => {
    const stored = transactionFactory({ id: 'transaction-2', description: 'Antiga' });
    const { service } = createService({
      storedTransactions: [stored],
      getResponse: new Error('api offline'),
      putResponse: new Error('api offline'),
    });

    const updated = await firstValueFrom(
      service.updateTransaction('transaction-2', {
        description: 'Nova',
        notes: 'Atualizada',
      })
    );

    expect(updated.description).toBe('Nova');
    expect(updated.notes).toBe('Atualizada');
  });

  it('delegates scheduling to updateTransaction with the expected payload', async () => {
    const { service } = createService({
      getResponse: new Error('api offline'),
    });
    const transaction = transactionFactory({
      id: 'transaction-3',
      scheduledDate: new Date('2026-05-10T00:00:00.000Z'),
    });
    const updateSpy = vi
      .spyOn(service, 'updateTransaction')
      .mockReturnValue(of(transaction));

    const result = await firstValueFrom(service.scheduleTransaction(transaction));

    expect(updateSpy).toHaveBeenCalledWith('transaction-3', {
      isScheduled: true,
      scheduledDate: transaction.scheduledDate,
    });
    expect(result).toEqual(transaction);
  });
});
