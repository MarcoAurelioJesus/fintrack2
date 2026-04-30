import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { TransactionService } from '@core/services/transaction.service';
import { Transaction, Category } from '@core/models';
import { APP_I18N } from '@core/i18n/app-labels';

const EXPENSE_TYPE = 'sa\u00EDda';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    CheckboxModule,
  ],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css'],
})
export class TransactionFormComponent implements OnInit {
  @Input() transaction: Transaction | null = null;
  @Input() categories: Category[] | null = null;
  @Output() saved = new EventEmitter<Transaction>();
  @Output() cancelled = new EventEmitter<void>();

  readonly labels = APP_I18N.transactionForm;
  readonly commonLabels = APP_I18N.common;
  readonly locale = APP_I18N.locale;
  readonly typeOptions = [
    { label: APP_I18N.transactions.typeOptions.income, value: 'entrada' },
    { label: APP_I18N.transactions.typeOptions.expense, value: EXPENSE_TYPE },
  ];
  private readonly fieldLabels: Record<string, string> = {
    description: this.labels.descriptionLabel,
    value: this.labels.valueLabel,
    type: this.labels.typeLabel,
    categoryId: this.labels.categoryLabel,
    date: this.labels.dateLabel,
    scheduledDate: this.labels.scheduledDateLabel,
    notes: this.labels.notesLabel,
  };

  form!: FormGroup;
  isLoading = false;
  showAdvanced = false;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.createForm();
    if (this.transaction) {
      this.populateForm();
    }
    this.showAdvanced = Boolean(this.transaction?.isScheduled || this.transaction?.notes);
  }

  private createForm(): void {
    this.form = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(3)]],
      value: [0, [Validators.required, Validators.min(0.01)]],
      type: ['entrada', Validators.required],
      categoryId: ['', Validators.required],
      date: [new Date(), Validators.required],
      isScheduled: [false],
      scheduledDate: [null],
      notes: [''],
    });

    this.form.get('isScheduled')?.valueChanges.subscribe((isScheduled: boolean) => {
      const scheduledDateControl = this.form.get('scheduledDate');
      if (isScheduled) {
        scheduledDateControl?.setValidators([Validators.required]);
      } else {
        scheduledDateControl?.clearValidators();
        scheduledDateControl?.setValue(null);
      }
      scheduledDateControl?.updateValueAndValidity();
    });
  }

  private populateForm(): void {
    if (!this.transaction) return;

    this.form.patchValue({
      description: this.transaction.description,
      value: this.transaction.value,
      type: this.normalizeTransactionType(this.transaction.type),
      categoryId: this.transaction.categoryId,
      date: new Date(this.transaction.date),
      isScheduled: this.transaction.isScheduled,
      scheduledDate: this.transaction.scheduledDate ? new Date(this.transaction.scheduledDate) : null,
      notes: this.transaction.notes,
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.isLoading = true;
    const formValue = {
      ...this.form.value,
      type: this.normalizeTransactionType(this.form.value.type),
    };

    if (this.transaction) {
      this.transactionService.updateTransaction(this.transaction.id, formValue).subscribe({
        next: (updated) => {
          this.isLoading = false;
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error updating transaction', err);
        },
      });
    } else {
      this.transactionService.createTransaction(formValue).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.saved.emit(created);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error creating transaction', err);
        },
      });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  toggleAdvanced(): void {
    this.showAdvanced = !this.showAdvanced;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private normalizeTransactionType(type: string): 'entrada' | typeof EXPENSE_TYPE {
    return type === 'entrada' ? 'entrada' : EXPENSE_TYPE;
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
    if (control?.hasError('min')) {
      return `${label} ${this.labels.fieldMinValueSuffix}`;
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
