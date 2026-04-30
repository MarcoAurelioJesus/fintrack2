import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TransactionService, TransactionFilter } from '@core/services/transaction.service';
import { CategoryService } from '@core/services/category.service';
import { Transaction, Category } from '@core/models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TransactionFormComponent } from './transaction-form.component';
import { APP_I18N } from '@core/i18n/app-labels';

type TransactionStatusFilter = 'all' | 'scheduled' | 'regular';

const EXPENSE_TYPE = 'sa\u00EDda';

interface TransactionDetailBar {
  label: string;
  value: number;
  height: number;
  color: string;
  highlighted: boolean;
}

interface TransactionHistoryItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    ToastModule,
    FormsModule,
    TransactionFormComponent,
  ],
  providers: [MessageService],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.css'],
})
export class TransactionsComponent implements OnInit {
  readonly labels = APP_I18N.transactions;
  readonly commonLabels = APP_I18N.common;
  transactions$: Observable<Transaction[]>;
  categories$: Observable<Category[]>;
  allTransactions: Transaction[] = [];
  displayForm = false;
  displayDetails = false;
  selectedTransaction: Transaction | null = null;
  transactionDetails: Transaction | null = null;
  filterCategoryId: string | null = null;
  filterType: string | null = null;
  searchText = '';
  statusFilter: TransactionStatusFilter = 'all';

  readonly typeOptions = [
    { label: this.labels.typeOptions.income, value: 'entrada' },
    { label: this.labels.typeOptions.expense, value: EXPENSE_TYPE },
  ];

  readonly statusOptions: { label: string; value: TransactionStatusFilter }[] = [
    { label: this.labels.statusOptions.all, value: 'all' },
    { label: this.labels.statusOptions.scheduled, value: 'scheduled' },
    { label: this.labels.statusOptions.regular, value: 'regular' },
  ];

  constructor(
    private transactionService: TransactionService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {
    this.transactions$ = this.transactionService.transactions$;
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit(): void {
    this.transactionService.transactions$.subscribe((transactions) => {
      this.allTransactions = transactions;
    });
  }

  openForm(transaction?: Transaction): void {
    this.selectedTransaction = transaction ?? null;
    this.displayForm = true;
  }

  closeForm(): void {
    this.displayForm = false;
    this.selectedTransaction = null;
  }

  openDetails(transaction: Transaction): void {
    this.transactionDetails = transaction;
    this.displayDetails = true;
  }

  closeDetails(): void {
    this.displayDetails = false;
    this.transactionDetails = null;
  }

  onTransactionSaved(): void {
    this.displayForm = false;
    this.selectedTransaction = null;
    this.applyFilters();
    this.messageService.add({
      severity: 'success',
      summary: this.commonLabels.success,
      detail: this.labels.saveSuccessDetail,
      life: 3000,
    });
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(this.labels.confirmDelete)) {
      this.transactionService.deleteTransaction(transaction.id).subscribe({
        next: () => {
          if (this.transactionDetails?.id === transaction.id) {
            this.closeDetails();
          }
          this.applyFilters();
          this.messageService.add({
            severity: 'success',
            summary: this.commonLabels.deleted,
            detail: this.labels.deleteSuccessDetail,
            life: 3000,
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.commonLabels.error,
            detail: this.labels.deleteErrorDetail,
            life: 3000,
          });
        },
      });
    }
  }

  applyFilters(): void {
    const filters: TransactionFilter = {};

    if (this.filterCategoryId) {
      filters.categoryId = this.filterCategoryId;
    }

    if (this.filterType) {
      filters.type = this.filterType as TransactionFilter['type'];
    }

    this.transactions$ = this.transactionService.getTransactions(filters);
  }

  clearFilters(): void {
    this.filterCategoryId = null;
    this.filterType = null;
    this.searchText = '';
    this.statusFilter = 'all';
    this.transactions$ = this.transactionService.getTransactions();
  }

  selectCategory(categoryId: string | null): void {
    this.filterCategoryId = categoryId;
    this.applyFilters();
  }

  visibleTransactions(transactions: Transaction[]): Transaction[] {
    const normalizedSearch = this.searchText.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        transaction.description.toLowerCase().includes(normalizedSearch) ||
        (transaction.notes ?? '').toLowerCase().includes(normalizedSearch) ||
        (transaction.category?.name ?? '').toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !this.filterCategoryId || transaction.categoryId === this.filterCategoryId;

      const matchesType =
        !this.filterType || this.normalizeTransactionType(transaction.type) === this.filterType;

      const matchesStatus =
        this.statusFilter === 'all' ||
        (this.statusFilter === 'scheduled' && transaction.isScheduled) ||
        (this.statusFilter === 'regular' && !transaction.isScheduled);

      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    });
  }

  getCategoryTransactionCount(categoryId: string): number {
    return this.allTransactions.filter((transaction) => transaction.categoryId === categoryId).length;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(APP_I18N.locale, {
      style: 'currency',
      currency: APP_I18N.currency,
    }).format(value);
  }

  formatDate(date: Date | string): string {
    return new Intl.DateTimeFormat(APP_I18N.locale).format(new Date(date));
  }

  getTypeClass(type: string): { [key: string]: boolean } {
    return {
      'text-success-500': this.normalizeTransactionType(type) === 'entrada',
      'text-danger-500': this.normalizeTransactionType(type) === EXPENSE_TYPE,
    };
  }

  getTransactionTypeLabel(type: string): string {
    return this.normalizeTransactionType(type) === 'entrada'
      ? this.labels.typeIncome
      : this.labels.typeExpense;
  }

  getDetailStatusLabel(transaction: Transaction): string {
    return transaction.isScheduled ? this.labels.statusScheduled : this.labels.statusPosted;
  }

  getTransactionCategoryBars(transaction: Transaction): TransactionDetailBar[] {
    const totals = new Map<
      string,
      { categoryId: string; label: string; color: string; total: number }
    >();

    this.allTransactions.forEach((item) => {
      const categoryId = item.categoryId || 'sem-categoria';
      const current =
        totals.get(categoryId) ??
        {
          categoryId,
          label: item.category?.name || this.commonLabels.noCategory,
          color: item.category?.color || '#a6a095',
          total: 0,
        };

      current.total += Math.abs(item.value);
      totals.set(categoryId, current);
    });

    const currentCategoryId = transaction.categoryId || 'sem-categoria';

    if (!totals.has(currentCategoryId)) {
      totals.set(currentCategoryId, {
        categoryId: currentCategoryId,
        label: transaction.category?.name || this.commonLabels.noCategory,
        color: transaction.category?.color || '#a6a095',
        total: Math.abs(transaction.value),
      });
    }

    const ranked = Array.from(totals.values()).sort((left, right) => right.total - left.total);
    const currentCategory = ranked.find((item) => item.categoryId === currentCategoryId);
    let selected = ranked.slice(0, 5);

    if (
      currentCategory &&
      !selected.some((item) => item.categoryId === currentCategory.categoryId)
    ) {
      selected = [...selected.slice(0, 4), currentCategory];
    }

    const maxTotal = Math.max(...selected.map((item) => item.total), Math.abs(transaction.value), 1);

    return selected.map((item) => ({
      label: item.label,
      value: item.total,
      height: Math.max(24, Math.round((item.total / maxTotal) * 100)),
      color: item.color,
      highlighted: item.categoryId === currentCategoryId,
    }));
  }

  getTransactionHistory(transaction: Transaction): TransactionHistoryItem[] {
    const history: TransactionHistoryItem[] = [
      { label: this.labels.historyDescription, value: transaction.description },
      { label: this.labels.historyType, value: this.getTransactionTypeLabel(transaction.type) },
      {
        label: this.labels.historyCategory,
        value: transaction.category?.name || this.commonLabels.noCategory,
      },
      { label: this.labels.historyDate, value: this.formatDate(transaction.date) },
      { label: this.labels.historyCreatedAt, value: this.formatDate(transaction.createdAt) },
      { label: this.labels.historyUpdatedAt, value: this.formatDate(transaction.updatedAt) },
    ];

    if (transaction.isScheduled && transaction.scheduledDate) {
      history.splice(4, 0, {
        label: this.labels.historyScheduledDate,
        value: this.formatDate(transaction.scheduledDate),
      });
    }

    if (transaction.notes) {
      history.push({ label: this.labels.historyNotes, value: transaction.notes });
    }

    return history;
  }

  private normalizeTransactionType(type: string): 'entrada' | typeof EXPENSE_TYPE {
    return type === 'entrada' ? 'entrada' : EXPENSE_TYPE;
  }
}
