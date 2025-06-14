import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './core/guard/auth.guard';
import { RoleGuard } from './core/guard/role.guard';
import { Role } from './core/enum/roles.enum';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },

  {
    path: '',
    loadComponent: () => import('./core/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [AuthGuard] },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [AuthGuard] },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [AuthGuard] },
      { path: 'products', loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent), canActivate: [AuthGuard] },
      { path: 'customers', loadComponent: () => import('./pages/customers/customers.component').then(m => m.CustomersComponent), canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.MANAGER_REVIEWERS] } },
      { path: 'users', loadComponent: () => import('./pages/users/pages/users-list/users-list.component').then(m => m.UsersComponent), canActivate: [AuthGuard, RoleGuard], data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] } },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent), canActivate: [AuthGuard] },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent), canActivate: [AuthGuard] },
    ]
  },
];
