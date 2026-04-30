import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DevService } from '../../core/services/dev.service';

@Component({
  selector: 'app-dev-controls',
  standalone: true,
  imports: [CommonModule, ButtonModule, ToastModule, ConfirmDialogModule],
  providers: [MessageService, ConfirmationService],
  template: `
    <div class="flex gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
      <p-button
        label="🌱 Popular Banco"
        severity="warning"
        [loading]="isSeedingDatabase()"
        (onClick)="onSeedClick()"
        [disabled]="isSeedingDatabase() || isClearingDatabase()"
        class="text-xs"
      />
      <p-button
        label="🗑️ Limpar Banco"
        severity="danger"
        [loading]="isClearingDatabase()"
        (onClick)="onClearClick()"
        [disabled]="isSeedingDatabase() || isClearingDatabase()"
        class="text-xs"
      />
    </div>
    <p-toast />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class DevControlsComponent {
  isSeedingDatabase = signal(false);
  isClearingDatabase = signal(false);

  constructor(
    private devService: DevService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  onSeedClick(): void {
    this.confirmationService.confirm({
      message: 'Deseja popular o banco de dados com dados de demonstração?',
      header: 'Popular Banco',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.seedDatabase();
      },
    });
  }

  onClearClick(): void {
    this.confirmationService.confirm({
      message: 'Deseja limpar TODAS as categorias e transações?',
      header: 'Limpar Banco',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.clearDatabase();
      },
    });
  }

  private seedDatabase(): void {
    this.isSeedingDatabase.set(true);
    this.devService.seedDatabase().subscribe({
      next: (response) => {
        this.isSeedingDatabase.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: response.message || 'Banco populado com sucesso',
          life: 3000,
        });
        // Reload para atualizar os dados
        setTimeout(() => window.location.reload(), 1000);
      },
      error: (error) => {
        this.isSeedingDatabase.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao popular banco',
          life: 3000,
        });
      },
    });
  }

  private clearDatabase(): void {
    this.isClearingDatabase.set(true);
    this.devService.clearDatabase().subscribe({
      next: (response) => {
        this.isClearingDatabase.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: response.message || 'Banco limpo com sucesso',
          life: 3000,
        });
        // Reload para atualizar os dados
        setTimeout(() => window.location.reload(), 1000);
      },
      error: (error) => {
        this.isClearingDatabase.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao limpar banco',
          life: 3000,
        });
      },
    });
  }
}
