import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { DashboardService } from '@core/services/dashboard.service';
import { Category, DashboardStats, Transaction } from '@core/models';
import { Observable } from 'rxjs';
import { DashboardSummaryComponent } from './dashboard-summary.component';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '@core/services/category.service';
import { TransactionService } from '@core/services/transaction.service';
import {
  getEffectiveTransactionDate,
  isTransactionEffective,
} from '@core/utils/transaction-rules';
import { APP_I18N } from '@core/i18n/app-labels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, DashboardSummaryComponent, SelectModule, ButtonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  readonly labels = APP_I18N.dashboard;
  stats$: Observable<DashboardStats>;
  chartData: Record<string, unknown> = { labels: [], datasets: [] };
  chartOptions: Record<string, unknown> = {};
  isLoading = false;
  selectedCategoryId: string | null = null;
  categoryOptions: Category[] = [];
  private transactions: Transaction[] = [];

  constructor(
    private dashboardService: DashboardService,
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {
    this.stats$ = this.dashboardService.stats$;
  }

  ngOnInit(): void {
    this.initializeChartOptions();
    this.transactionService.transactions$.subscribe((transactions) => {
      this.transactions = transactions;
      this.updateChart();
    });
    this.categoryService.categories$.subscribe((categories) => {
      this.categoryOptions = categories;
    });
  }

  private initializeChartOptions(): void {
    this.chartOptions = {
      maintainAspectRatio: true,
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: '#1f1e1c',
          titleColor: '#f8f7f2',
          bodyColor: '#ece8df',
          borderColor: '#4ca2ff',
          borderWidth: 1,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#918c84', padding: 10 },
          grid: { color: 'rgba(255,255,255,0.08)' },
          border: { display: false },
        },
        x: {
          ticks: { color: '#918c84', padding: 10 },
          grid: { display: false },
          border: { display: false },
        },
      },
    };
  }

  onCategoryFilterChange(): void {
    this.updateChart();
  }

  private updateChart(): void {
    const now = new Date();
    const monthRefs: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      monthRefs.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }

    const labels = monthRefs.map((date) =>
      date.toLocaleDateString(APP_I18N.locale, { month: 'short' }).replace('.', '')
    );
    const values = monthRefs.map((monthRef) => {
      const month = monthRef.getMonth();
      const year = monthRef.getFullYear();
      const filtered = this.transactions.filter((transaction) => {
        const date = getEffectiveTransactionDate(transaction);
        const sameMonth = date.getMonth() === month && date.getFullYear() === year;
        const sameCategory = this.selectedCategoryId
          ? transaction.categoryId === this.selectedCategoryId
          : true;
        return sameMonth && sameCategory && isTransactionEffective(transaction, now);
      });
      return filtered.reduce((sum, transaction) => {
        return sum + (transaction.type === 'entrada' ? transaction.value : -transaction.value);
      }, 0);
    });

    const activeIndex = labels.length - 1;
    const backgroundColor = values.map((_, index) =>
      index === activeIndex ? 'rgba(59, 130, 246, 0.95)' : 'rgba(191, 219, 254, 0.9)'
    );

    this.chartData = {
      labels,
      datasets: [
        {
          label: this.labels.chartDatasetLabel,
          data: values,
          borderRadius: 6,
          backgroundColor,
          maxBarThickness: 46,
        },
      ],
    };
  }

  refreshStats(): void {
    this.isLoading = true;
    this.dashboardService.refreshStats();
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(APP_I18N.locale, {
      style: 'currency',
      currency: APP_I18N.currency,
    }).format(value);
  }
}
