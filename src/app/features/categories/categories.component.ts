import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CategoryService } from '@core/services/category.service';
import { Category } from '@core/models';
import { Observable } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CategoryFormComponent } from './category-form.component';
import { InputTextModule } from 'primeng/inputtext';
import { APP_I18N } from '@core/i18n/app-labels';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    DialogModule,
    ToastModule,
    FormsModule,
    CategoryFormComponent,
    InputTextModule,
  ],
  providers: [MessageService],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css'],
})
export class CategoriesComponent implements OnInit {
  readonly labels = APP_I18N.categories;
  readonly commonLabels = APP_I18N.common;
  categories$: Observable<Category[]>;
  displayForm = false;
  selectedCategory: Category | null = null;
  searchText = '';

  constructor(
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {
    this.categories$ = this.categoryService.categories$;
  }

  ngOnInit(): void {}

  openForm(category?: Category): void {
    if (category) {
      this.selectedCategory = category;
    }
    this.displayForm = true;
  }

  closeForm(): void {
    this.displayForm = false;
    this.selectedCategory = null;
  }

  onCategorySaved(): void {
    this.displayForm = false;
    this.selectedCategory = null;
    this.messageService.add({
      severity: 'success',
      summary: this.commonLabels.success,
      detail: this.labels.saveSuccessDetail,
      life: 3000,
    });
  }

  deleteCategory(category: Category): void {
    if (confirm(this.labels.confirmDelete)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.commonLabels.deleted,
            detail: this.labels.deleteSuccessDetail,
            life: 3000,
          });
        },
        error: (err) => {
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

  toggleFavorite(category: Category): void {
    this.categoryService.toggleFavorite(category.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'info',
          summary: this.commonLabels.updated,
          detail: category.isFavorite
            ? this.labels.favoriteRemovedDetail
            : this.labels.favoriteAddedDetail,
          life: 2000,
        });
      },
      error: (err) => {
        console.error('Error toggling favorite', err);
      },
    });
  }

  filteredCategories(categories: Category[]): Category[] {
    if (!this.searchText) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  favoriteCategories(categories: Category[]): Category[] {
    return this.filteredCategories(categories.filter((c) => c.isFavorite));
  }

  nonFavoriteCategories(categories: Category[]): Category[] {
    return this.filteredCategories(categories.filter((c) => !c.isFavorite));
  }

  getFavoriteToggleAriaLabel(category: Category): string {
    return category.isFavorite
      ? this.labels.favoriteRemoveAriaLabel
      : this.labels.favoriteAddAriaLabel;
  }
}
