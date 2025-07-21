import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './core/guard/auth.guard';
import { RoleGuard } from './core/guard/role.guard';
import { Role } from './core/enum/roles.enum';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },

  {
    path: '',
    loadComponent: () =>
      import('./core/components/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        canActivate: [AuthGuard],
      },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/products/products.component').then(
            (m) => m.ProductsComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'customers',
        loadComponent: () =>
          import(
            './pages/customers/pages/customers-list/customers-list.component'
          ).then((m) => m.CustomersListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/create',
        loadComponent: () =>
          import(
            './pages/customers/pages/customer-create/customer-create.component'
          ).then((m) => m.CustomerCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import(
            './pages/customers/pages/customer-view/customer-view.component'
          ).then((m) => m.CustomerViewComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () =>
          import(
            './pages/customers/pages/customer-edit/customer-edit.component'
          ).then((m) => m.CustomerEditComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/pages/users-list/users-list.component').then(
            (m) => m.UsersComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./pages/users/pages/user-create/user-create.component').then(
            (m) => m.UserCreateComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./pages/users/pages/user-edit/user-edit.component').then(
            (m) => m.UserEditComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./pages/users/pages/user-view/user-view.component').then(
            (m) => m.UserViewComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./pages/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import(
            './pages/tenants/pages/tenant-list/tenant-list.component'
          ).then((m) => m.TenantListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'tenants/create',
        loadComponent: () =>
          import(
            './pages/tenants/pages/tenant-create/tenant-create.component'
          ).then((m) => m.TenantCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN] },
      },
    ],
  },
];
