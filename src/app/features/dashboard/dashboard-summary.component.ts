import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DashboardStats } from '@core/models';
import { APP_I18N } from '@core/i18n/app-labels';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './dashboard-summary.component.html',
  styleUrls: ['./dashboard-summary.component.css'],
})
export class DashboardSummaryComponent {
  readonly labels = APP_I18N.dashboard.summary;
  @Input({ required: true }) stats!: DashboardStats;
  @Input() isLoading = false;
  @Output() refreshRequested = new EventEmitter<void>();

  onRefresh(): void {
    this.refreshRequested.emit();
  }

  getBalanceClass(balance: number): { [key: string]: boolean } {
    return {
      'text-success-500': balance >= 0,
      'text-danger-500': balance < 0,
      'bg-success-500/10': balance >= 0,
      'bg-danger-500/10': balance < 0,
      'border-success-500/30': balance >= 0,
      'border-danger-500/30': balance < 0,
    };
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat(APP_I18N.locale, {
      style: 'currency',
      currency: APP_I18N.currency,
    }).format(value);
  }
}
