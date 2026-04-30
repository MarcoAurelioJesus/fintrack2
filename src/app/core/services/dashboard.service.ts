import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardStats, Transaction, Category, MonthlyEvolutionItem } from '../models';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';
import {
  getEffectiveTransactionDate,
  isTransactionEffective,
} from '../utils/transaction-rules';
import { APP_I18N } from '@core/i18n/app-labels';

export interface IDashboardService {
  stats$: Observable<DashboardStats>;
  getStats(): Observable<DashboardStats>;
  refreshStats(): void;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService implements IDashboardService {
  private statsSubject = new BehaviorSubject<DashboardStats | null>(null);
  public stats$ = this.statsSubject.asObservable().pipe(
    map((stats) => stats || this.getEmptyStats())
  );

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {
    this.loadStats();
  }

  private loadStats(): void {
    combineLatest([
      this.transactionService.getTransactions(),
      this.categoryService.getCategories(),
    ]).subscribe({
      next: ([transactions, categories]) => {
        const stats = this.calculateStats(transactions, categories);
        this.statsSubject.next(stats);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.statsSubject.next(this.getEmptyStats());
      },
    });
  }

  private calculateStats(transactions: Transaction[], categories: Category[]): DashboardStats {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const effectiveTransactions = transactions.filter((t) =>
      isTransactionEffective(t, currentDate)
    );

    const monthTransactions = effectiveTransactions.filter((t) => {
      const effectiveDate = getEffectiveTransactionDate(t);
      return (
        effectiveDate.getMonth() === currentMonth &&
        effectiveDate.getFullYear() === currentYear
      );
    });

    let currentBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const categoryMap = new Map<string, { total: number; count: number }>();

    effectiveTransactions.forEach((t) => {
      const amount = t.value;
      if (t.type === 'entrada') {
        currentBalance += amount;
      } else {
        currentBalance -= amount;
      }
    });

    monthTransactions.forEach((t) => {
      const amount = t.value;
      if (t.type === 'entrada') {
        monthlyIncome += amount;
        incomeCount++;
      } else {
        monthlyExpense += amount;
        expenseCount++;
      }

      if (!categoryMap.has(t.categoryId)) {
        categoryMap.set(t.categoryId, { total: 0, count: 0 });
      }
      const catData = categoryMap.get(t.categoryId)!;
      catData.total += amount;
      catData.count += 1;
    });

    const totalCategoryValue = Array.from(categoryMap.values()).reduce((sum, data) => sum + data.total, 0) || 1;

    const byCategory = Array.from(categoryMap.entries()).map(([categoryId, data]) => {
      const category = categories.find((c) => c.id === categoryId);
      return {
        categoryId,
        categoryName: category?.name || APP_I18N.common.noCategory,
        categoryColor: category?.color || '#999999',
        total: data.total,
        count: data.count,
        percentage: (data.total / totalCategoryValue) * 100,
      };
    });

    const monthlyEvolution = this.calculateMonthlyEvolution(transactions);

    return {
      currentBalance,
      monthlyIncome,
      monthlyExpense,
      incomeCount,
      expenseCount,
      byCategory,
      monthlyEvolution,
    };
  }

  private calculateMonthlyEvolution(transactions: Transaction[]): MonthlyEvolutionItem[] {
    const now = new Date();
    const monthKeys: string[] = [];
    const itemsMap = new Map<string, MonthlyEvolutionItem>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthKeys.push(key);
      itemsMap.set(key, {
        label: d.toLocaleDateString(APP_I18N.locale, { month: 'short' }).replace('.', ''),
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    transactions
      .filter((transaction) => isTransactionEffective(transaction, now))
      .forEach((transaction) => {
      const date = getEffectiveTransactionDate(transaction);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const item = itemsMap.get(key);
      if (!item) return;

      if (transaction.type === 'entrada') {
        item.income += transaction.value;
      } else {
        item.expense += transaction.value;
      }
      item.balance = item.income - item.expense;
    });

    return monthKeys.map((key) => itemsMap.get(key)!);
  }

  private getEmptyStats(): DashboardStats {
    return {
      currentBalance: 0,
      monthlyIncome: 0,
      monthlyExpense: 0,
      incomeCount: 0,
      expenseCount: 0,
      byCategory: [],
      monthlyEvolution: [],
    };
  }

  getStats(): Observable<DashboardStats> {
    return this.stats$;
  }

  refreshStats(): void {
    this.loadStats();
  }
}
