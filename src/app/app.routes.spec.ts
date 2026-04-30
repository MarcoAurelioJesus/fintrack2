import { describe, expect, it } from 'vitest';
import { routes } from './app.routes';
import { CategoriesComponent } from './features/categories/categories.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { TransactionsComponent } from './features/transactions/transactions.component';

describe('app routes', () => {
  it('redirects the root path to the dashboard', () => {
    expect(routes[0]).toMatchObject({
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    });
  });

  it('registers the feature routes and the wildcard redirect', () => {
    expect(routes).toContainEqual({
      path: 'dashboard',
      component: DashboardComponent,
    });
    expect(routes).toContainEqual({
      path: 'transactions',
      component: TransactionsComponent,
    });
    expect(routes).toContainEqual({
      path: 'categories',
      component: CategoriesComponent,
    });
    expect(routes.at(-1)).toMatchObject({
      path: '**',
      redirectTo: 'dashboard',
    });
  });
});
