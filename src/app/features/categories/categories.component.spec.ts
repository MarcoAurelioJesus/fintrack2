import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CategoriesComponent } from './categories.component';
import { categoryFactory } from '../../../test/factories';
import { APP_I18N } from '@core/i18n/app-labels';

describe('CategoriesComponent', () => {
  const messageService = {
    add: vi.fn(),
  };

  const categoryService = {
    categories$: of([]),
    deleteCategory: vi.fn(() => of(void 0)),
    toggleFavorite: vi.fn(() => of(categoryFactory())),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    messageService.add.mockReset();
    categoryService.deleteCategory.mockReset();
    categoryService.deleteCategory.mockReturnValue(of(void 0));
    categoryService.toggleFavorite.mockReset();
    categoryService.toggleFavorite.mockReturnValue(of(categoryFactory()));
  });

  it('opens and closes the form while tracking the selected category', () => {
    const component = new CategoriesComponent(categoryService as never, messageService as never);
    const category = categoryFactory({ id: 'selected' });

    component.openForm(category);
    expect(component.displayForm).toBe(true);
    expect(component.selectedCategory).toEqual(category);

    component.closeForm();
    expect(component.displayForm).toBe(false);
    expect(component.selectedCategory).toBeNull();
  });

  it('shows a success toast after saving a category', () => {
    const component = new CategoriesComponent(categoryService as never, messageService as never);
    component.displayForm = true;
    component.selectedCategory = categoryFactory();

    component.onCategorySaved();

    expect(component.displayForm).toBe(false);
    expect(component.selectedCategory).toBeNull();
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
      })
    );
  });

  it('deletes a category after confirmation and shows feedback', () => {
    const component = new CategoriesComponent(categoryService as never, messageService as never);
    const category = categoryFactory({ id: 'delete-me' });
    vi.stubGlobal('confirm', vi.fn(() => true));

    component.deleteCategory(category);

    expect(categoryService.deleteCategory).toHaveBeenCalledWith('delete-me');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'success',
      })
    );
  });

  it('shows the right favorite feedback based on the current state', () => {
    const component = new CategoriesComponent(categoryService as never, messageService as never);
    const category = categoryFactory({ id: 'favorite', isFavorite: false });

    component.toggleFavorite(category);

    expect(categoryService.toggleFavorite).toHaveBeenCalledWith('favorite');
    expect(messageService.add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'info',
        detail: APP_I18N.categories.favoriteAddedDetail,
      })
    );
  });

  it('filters and separates favorite categories', () => {
    const component = new CategoriesComponent(categoryService as never, messageService as never);
    const categories = [
      categoryFactory({ id: '1', name: 'Mercado', isFavorite: true }),
      categoryFactory({ id: '2', name: 'Transporte', isFavorite: false }),
      categoryFactory({ id: '3', name: 'Reserva', isFavorite: true }),
    ];

    component.searchText = 're';
    expect(component.filteredCategories(categories).map((category) => category.id)).toEqual(['3']);

    component.searchText = '';
    expect(component.favoriteCategories(categories).map((category) => category.id)).toEqual(['1', '3']);
    expect(component.nonFavoriteCategories(categories).map((category) => category.id)).toEqual(['2']);
  });
});
