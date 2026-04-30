import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Category, ApiResponse } from '../models';

// Interface para o contrato do serviço
export interface ICategoryService {
  categories$: Observable<Category[]>;
  getCategories(): Observable<Category[]>;
  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category>;
  updateCategory(id: string, category: Partial<Category>): Observable<Category>;
  deleteCategory(id: string): Observable<void>;
  toggleFavorite(id: string): Observable<Category>;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService implements ICategoryService {
  private readonly apiUrl = '/api/categories';
  private readonly storageKey = 'fintrack.categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
    this.loadCategories();
  }

  private getDefaultCategories(): Category[] {
    const now = new Date();
    return [
      { id: crypto.randomUUID(), name: 'Alimentação', color: '#f97316', createdAt: now, updatedAt: now, isFavorite: true },
      { id: crypto.randomUUID(), name: 'Transporte', color: '#3b82f6', createdAt: now, updatedAt: now, isFavorite: false },
      { id: crypto.randomUUID(), name: 'Salário', color: '#22c55e', createdAt: now, updatedAt: now, isFavorite: true },
    ];
  }

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const defaults = this.getDefaultCategories();
      this.categoriesSubject.next(defaults);
      this.persistCategories(defaults);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Category[];
      this.categoriesSubject.next(parsed);
    } catch (err) {
      console.error('Failed to parse stored categories', err);
    }
  }

  private persistCategories(categories: Category[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(categories));
  }

  private loadCategories(): void {
    this.http.get<ApiResponse<Category[]>>(this.apiUrl).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.categoriesSubject.next(response.data);
          this.persistCategories(response.data);
        }
      },
      error: () => {
        // Keep local categories when API is unavailable.
      },
    });
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category> {
    return new Observable((observer) => {
      this.http.post<ApiResponse<Category>>(this.apiUrl, category).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const currentCategories = this.categoriesSubject.value;
            const updated = [...currentCategories, response.data];
            this.categoriesSubject.next(updated);
            this.persistCategories(updated);
            observer.next(response.data);
            observer.complete();
          }
        },
        error: () => {
          const now = new Date();
          const created: Category = {
            ...category,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
          };
          const updated = [...this.categoriesSubject.value, created];
          this.categoriesSubject.next(updated);
          this.persistCategories(updated);
          observer.next(created);
          observer.complete();
        },
      });
    });
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return new Observable((observer) => {
      this.http.put<ApiResponse<Category>>(`${this.apiUrl}/${id}`, category).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const currentCategories = this.categoriesSubject.value;
            const index = currentCategories.findIndex((c) => c.id === id);
            if (index > -1) {
              currentCategories[index] = response.data;
              const updated = [...currentCategories];
              this.categoriesSubject.next(updated);
              this.persistCategories(updated);
            }
            observer.next(response.data);
            observer.complete();
          }
        },
        error: () => {
          const currentCategories = this.categoriesSubject.value;
          const index = currentCategories.findIndex((c) => c.id === id);
          if (index === -1) {
            observer.error('Category not found');
            return;
          }
          const updatedCategory = {
            ...currentCategories[index],
            ...category,
            updatedAt: new Date(),
          } as Category;
          const updated = [...currentCategories];
          updated[index] = updatedCategory;
          this.categoriesSubject.next(updated);
          this.persistCategories(updated);
          observer.next(updatedCategory);
          observer.complete();
        },
      });
    });
  }

  deleteCategory(id: string): Observable<void> {
    return new Observable((observer) => {
      this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).subscribe({
        next: () => {
          const currentCategories = this.categoriesSubject.value;
          const updated = currentCategories.filter((c) => c.id !== id);
          this.categoriesSubject.next(updated);
          this.persistCategories(updated);
          observer.next();
          observer.complete();
        },
        error: () => {
          const updated = this.categoriesSubject.value.filter((c) => c.id !== id);
          this.categoriesSubject.next(updated);
          this.persistCategories(updated);
          observer.next();
          observer.complete();
        },
      });
    });
  }

  toggleFavorite(id: string): Observable<Category> {
    const category = this.categoriesSubject.value.find((c) => c.id === id);
    if (!category) {
      return new Observable((observer) => observer.error('Category not found'));
    }

    return this.updateCategory(id, { isFavorite: !category.isFavorite });
  }
}
