import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Transaction, ApiResponse } from '../models';

export interface ITransactionService {
  transactions$: Observable<Transaction[]>;
  getTransactions(filters?: TransactionFilter): Observable<Transaction[]>;
  getTransactionById(id: string): Observable<Transaction>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Observable<Transaction>;
  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction>;
  deleteTransaction(id: string): Observable<void>;
  scheduleTransaction(transaction: Transaction): Observable<Transaction>;
}

export interface TransactionFilter {
  categoryId?: string;
  type?: 'entrada' | 'saída';
  startDate?: Date;
  endDate?: Date;
  isScheduled?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TransactionService implements ITransactionService {
  private readonly apiUrl = '/api/transactions';
  private readonly storageKey = 'fintrack.transactions';
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
    this.loadTransactions();
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Transaction[];
      this.transactionsSubject.next(parsed);
    } catch (err) {
      console.error('Failed to parse stored transactions', err);
    }
  }

  private persistTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(transactions));
  }

  private buildLocalTransaction(
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Transaction {
    const now = new Date();
    return {
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
  }

  private loadTransactions(): void {
    this.http.get<ApiResponse<Transaction[]>>(this.apiUrl).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactionsSubject.next(response.data);
          this.persistTransactions(response.data);
        }
      },
      error: () => {
        // Keep local data when API is unavailable.
      },
    });
  }

  getTransactions(filters?: TransactionFilter): Observable<Transaction[]> {
    return new Observable((observer) => {
      let url = this.apiUrl;
      if (filters) {
        const params = new URLSearchParams();
        if (filters.categoryId) params.append('categoryId', filters.categoryId);
        if (filters.type) params.append('type', filters.type);
        if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
        if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
        if (filters.isScheduled !== undefined) params.append('isScheduled', filters.isScheduled.toString());

        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      this.http.get<ApiResponse<Transaction[]>>(url).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            observer.next(response.data);
          } else {
            observer.next(this.transactionsSubject.value);
          }
          observer.complete();
        },
        error: () => {
          observer.next(this.transactionsSubject.value);
          observer.complete();
        },
      });
    });
  }

  getTransactionById(id: string): Observable<Transaction> {
    return new Observable((observer) => {
      this.http.get<ApiResponse<Transaction>>(`${this.apiUrl}/${id}`).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            observer.next(response.data);
          }
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Observable<Transaction> {
    return new Observable((observer) => {
      this.http.post<ApiResponse<Transaction>>(this.apiUrl, transaction).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const currentTransactions = this.transactionsSubject.value;
            const updated = [...currentTransactions, response.data];
            this.transactionsSubject.next(updated);
            this.persistTransactions(updated);
            observer.next(response.data);
            observer.complete();
          }
        },
        error: () => {
          const created = this.buildLocalTransaction(transaction);
          const updated = [...this.transactionsSubject.value, created];
          this.transactionsSubject.next(updated);
          this.persistTransactions(updated);
          observer.next(created);
          observer.complete();
        },
      });
    });
  }

  updateTransaction(id: string, transaction: Partial<Transaction>): Observable<Transaction> {
    return new Observable((observer) => {
      this.http.put<ApiResponse<Transaction>>(`${this.apiUrl}/${id}`, transaction).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const currentTransactions = this.transactionsSubject.value;
            const index = currentTransactions.findIndex((t) => t.id === id);
            if (index > -1) {
              currentTransactions[index] = response.data;
              const updated = [...currentTransactions];
              this.transactionsSubject.next(updated);
              this.persistTransactions(updated);
            }
            observer.next(response.data);
            observer.complete();
          }
        },
        error: () => {
          const currentTransactions = this.transactionsSubject.value;
          const index = currentTransactions.findIndex((t) => t.id === id);
          if (index === -1) {
            observer.error('Transaction not found');
            return;
          }

          const updatedTransaction = {
            ...currentTransactions[index],
            ...transaction,
            updatedAt: new Date(),
          } as Transaction;
          const updated = [...currentTransactions];
          updated[index] = updatedTransaction;
          this.transactionsSubject.next(updated);
          this.persistTransactions(updated);
          observer.next(updatedTransaction);
          observer.complete();
        },
      });
    });
  }

  deleteTransaction(id: string): Observable<void> {
    return new Observable((observer) => {
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          const currentTransactions = this.transactionsSubject.value;
          const updated = currentTransactions.filter((t) => t.id !== id);
          this.transactionsSubject.next(updated);
          this.persistTransactions(updated);
          observer.next();
          observer.complete();
        },
        error: () => {
          const updated = this.transactionsSubject.value.filter((t) => t.id !== id);
          this.transactionsSubject.next(updated);
          this.persistTransactions(updated);
          observer.next();
          observer.complete();
        },
      });
    });
  }

  scheduleTransaction(transaction: Transaction): Observable<Transaction> {
    return this.updateTransaction(transaction.id, {
      isScheduled: true,
      scheduledDate: transaction.scheduledDate,
    });
  }
}
