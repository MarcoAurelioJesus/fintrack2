import { describe, expect, it } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  it('exposes the main navigation entries', () => {
    const component = new SidebarComponent();

    expect(component.menuItems.map((item) => item.route)).toEqual([
      '/dashboard',
      '/transactions',
      '/categories',
    ]);
  });

  it('toggles the collapsed state', () => {
    const component = new SidebarComponent();

    component.toggleSidebar();
    expect(component.isCollapsed).toBe(true);

    component.toggleSidebar();
    expect(component.isCollapsed).toBe(false);
  });
});
