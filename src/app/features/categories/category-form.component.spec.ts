import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoryFormComponent } from './category-form.component';
import { categoryFactory } from '../../../test/factories';
import { APP_I18N } from '@core/i18n/app-labels';

describe('CategoryFormComponent', () => {
  const categoryService = {
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    categoryService.createCategory.mockReset();
    categoryService.updateCategory.mockReset();
  });

  it('populates the form when editing an existing category', () => {
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    component.category = categoryFactory({
      id: 'category-edit',
      name: 'Investimentos',
      color: '#0f172a',
      isFavorite: false,
    });

    component.ngOnInit();

    expect(component.form.value).toMatchObject({
      name: 'Investimentos',
      color: '#0f172a',
      isFavorite: false,
    });
  });

  it('updates the selected preset color', () => {
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    component.ngOnInit();

    component.selectPresetColor('#ef4444');

    expect(component.form.get('color')?.value).toBe('#ef4444');
  });

  it('uses the centralized fallback label in the preview', () => {
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    component.ngOnInit();

    expect(component.getPreviewName()).toBe(APP_I18N.categoryForm.previewFallback);
  });

  it('marks invalid fields as touched instead of submitting', () => {
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    component.ngOnInit();

    component.onSubmit();

    expect(component.form.get('name')?.touched).toBe(true);
    expect(categoryService.createCategory).not.toHaveBeenCalled();
  });

  it('creates a new category and emits the saved event', () => {
    const created = categoryFactory({ id: 'created-category', name: 'Reserva' });
    categoryService.createCategory.mockReturnValue(of(created));
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    const emitSpy = vi.spyOn(component.saved, 'emit');
    component.ngOnInit();
    component.form.patchValue({
      name: 'Reserva',
      color: '#3b82f6',
      isFavorite: true,
    });

    component.onSubmit();

    expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'Reserva',
      color: '#3b82f6',
      isFavorite: true,
    });
    expect(emitSpy).toHaveBeenCalledWith(created);
    expect(component.isLoading).toBe(false);
  });

  it('updates an existing category and emits the result', () => {
    const updated = categoryFactory({ id: 'category-edit', name: 'Nova categoria' });
    categoryService.updateCategory.mockReturnValue(of(updated));
    const component = new CategoryFormComponent(
      new FormBuilder(),
      categoryService as never
    );
    component.category = categoryFactory({ id: 'category-edit', name: 'Antiga categoria' });
    const emitSpy = vi.spyOn(component.saved, 'emit');

    component.ngOnInit();
    component.form.patchValue({
      name: 'Nova categoria',
      color: '#22c55e',
      isFavorite: true,
    });
    component.onSubmit();

    expect(categoryService.updateCategory).toHaveBeenCalledWith('category-edit', {
      name: 'Nova categoria',
      color: '#22c55e',
      isFavorite: true,
    });
    expect(emitSpy).toHaveBeenCalledWith(updated);
  });
});
