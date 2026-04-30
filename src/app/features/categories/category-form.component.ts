import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CategoryService } from '@core/services/category.service';
import { Category } from '@core/models';
import { APP_I18N } from '@core/i18n/app-labels';

const PRESET_COLORS = [
  '#93c5fd',
  '#5eead4',
  '#f28b82',
  '#f59e0b',
  '#c4b5fd',
  '#60a5fa',
  '#a3e635',
  '#10b981',
];

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
  ],
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.css'],
})
export class CategoryFormComponent implements OnInit {
  @Input() category: Category | null = null;
  @Output() saved = new EventEmitter<Category>();
  @Output() cancelled = new EventEmitter<void>();

  readonly labels = APP_I18N.categoryForm;
  readonly commonLabels = APP_I18N.common;
  form!: FormGroup;
  isLoading = false;
  presetColors = PRESET_COLORS;
  private readonly fieldLabels: Record<string, string> = {
    name: this.labels.nameLabel,
    color: this.labels.colorLabel,
  };

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.createForm();
    if (this.category) {
      this.populateForm();
    }
  }

  private createForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      color: ['#93c5fd', Validators.required],
      isFavorite: [false],
    });
  }

  private populateForm(): void {
    if (!this.category) return;

    this.form.patchValue({
      name: this.category.name,
      color: this.category.color,
      isFavorite: this.category.isFavorite ?? false,
    });
  }

  selectPresetColor(color: string): void {
    this.form.patchValue({ color });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.isLoading = true;
    const formValue = this.form.value;

    if (this.category) {
      this.categoryService.updateCategory(this.category.id, formValue).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error updating category', err);
        },
      });
    } else {
      this.categoryService.createCategory(formValue).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.saved.emit(created);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error creating category', err);
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getPreviewName(): string {
    const value = (this.form.get('name')?.value ?? '').trim();
    return value || this.labels.previewFallback;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    const label = this.fieldLabels[fieldName] ?? fieldName;
    if (control?.hasError('required')) {
      return `${label} ${this.labels.fieldRequiredSuffix}`;
    }
    if (control?.hasError('minlength')) {
      return `${label} ${this.labels.fieldMinLengthSuffix}`;
    }
    if (control?.hasError('maxlength')) {
      return `${label} ${this.labels.fieldMaxLengthSuffix}`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
