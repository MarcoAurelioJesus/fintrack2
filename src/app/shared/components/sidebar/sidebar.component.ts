import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { APP_I18N } from '@core/i18n/app-labels';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  readonly labels = APP_I18N;

  readonly menuItems = [
    {
      label: APP_I18N.navigation.dashboard,
      icon: 'pi-home',
      route: '/dashboard',
    },
    {
      label: APP_I18N.navigation.transactions,
      icon: 'pi-arrow-right-arrow-left',
      route: '/transactions',
    },
    {
      label: APP_I18N.navigation.categories,
      icon: 'pi-tag',
      route: '/categories',
    },
  ];

  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
