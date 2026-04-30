import { firstValueFrom, of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CategoryService } from './category.service';
import { Category } from '../models';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

function categoryFactory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    name: 'Salario',
    color: '#22c55e',
    isFavorite: true,
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createService(options: {
  storedCategories?: Category[];
  getResponse?: unknown;
  postResponse?: unknown;
  putResponse?: unknown;
  deleteResponse?: unknown;
} = {}) {
  const http = {
    get: vi.fn(() =>
      options.getResponse instanceof Error
        ? throwError(() => options.getResponse)
        : of(options.getResponse ?? { success: true, data: [] })
    ),
    post: vi.fn(() =>
      options.postResponse instanceof Error
        ? throwError(() => options.postResponse)
        : of(options.postResponse ?? { success: true, data: categoryFactory({ id: 'created' }) })
    ),
    put: vi.fn(() =>
      options.putResponse instanceof Error
        ? throwError(() => options.putResponse)
        : of(options.putResponse ?? { success: true, data: categoryFactory({ name: 'Atualizada' }) })
    ),
    delete: vi.fn(() =>
      options.deleteResponse instanceof Error
        ? throwError(() => options.deleteResponse)
        : of(options.deleteResponse ?? { success: true, data: null })
    ),
  };

  const storage = new MemoryStorage();
  if (options.storedCategories) {
    storage.setItem('fintrack.categories', JSON.stringify(options.storedCategories));
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });

  const service = new CategoryService(http as never);
  return { service, http, storage };
}

describe('CategoryService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads default categories into storage when local data is missing', async () => {
    const { service, storage } = createService({
      getResponse: new Error('api offline'),
    });

    const categories = await firstValueFrom(service.getCategories());

    expect(categories).toHaveLength(3);
    expect(categories.every((category) => category.id)).toBe(true);
    expect(JSON.parse(storage.getItem('fintrack.categories') || '[]')).toHaveLength(3);
  });

  it('replaces local categories with API data when the backend responds', async () => {
    const stored = [categoryFactory({ id: 'stored', name: 'Local' })];
    const apiCategory = categoryFactory({ id: 'api', name: 'Servidor', color: '#111111' });

    const { service, storage, http } = createService({
      storedCategories: stored,
      getResponse: { success: true, data: [apiCategory] },
    });

    const categories = await firstValueFrom(service.getCategories());

    expect(http.get).toHaveBeenCalledWith('/api/categories');
    expect(categories).toEqual([apiCategory]);
    expect(JSON.parse(storage.getItem('fintrack.categories') || '[]')).toMatchObject([
      {
        id: 'api',
        name: 'Servidor',
        color: '#111111',
        isFavorite: true,
      },
    ]);
  });

  it('creates a category locally when the API request fails', async () => {
    const existing = categoryFactory();
    const { service } = createService({
      storedCategories: [existing],
      getResponse: new Error('api offline'),
      postResponse: new Error('api offline'),
    });

    const created = await firstValueFrom(
      service.createCategory({
        name: 'Investimentos',
        color: '#0f172a',
        isFavorite: false,
      })
    );
    const categories = await firstValueFrom(service.getCategories());

    expect(created.id).toBeTruthy();
    expect(created.name).toBe('Investimentos');
    expect(categories).toHaveLength(2);
    expect(categories.at(-1)?.name).toBe('Investimentos');
  });

  it('updates local state when toggling a favorite category', async () => {
    const category = categoryFactory({ id: 'favorite', isFavorite: true });
    const updatedCategory = categoryFactory({ id: 'favorite', isFavorite: false });
    const { service } = createService({
      storedCategories: [category],
      getResponse: new Error('api offline'),
      putResponse: { success: true, data: updatedCategory },
    });

    const result = await firstValueFrom(service.toggleFavorite('favorite'));
    const categories = await firstValueFrom(service.getCategories());

    expect(result.isFavorite).toBe(false);
    expect(categories[0].isFavorite).toBe(false);
  });

  it('removes a category from local state even when delete falls back locally', async () => {
    const categories = [
      categoryFactory({ id: 'category-1' }),
      categoryFactory({ id: 'category-2', name: 'Transporte' }),
    ];
    const { service } = createService({
      storedCategories: categories,
      getResponse: new Error('api offline'),
      deleteResponse: new Error('api offline'),
    });

    await firstValueFrom(service.deleteCategory('category-1'));
    const remaining = await firstValueFrom(service.getCategories());

    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('category-2');
  });
});
