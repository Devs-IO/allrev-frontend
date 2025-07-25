import { Routes } from '@angular/router';
import { AuthGuard } from './core/guard/auth.guard';
import { RoleGuard } from './core/guard/role.guard';
import { Role } from './core/enum/roles.enum';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('../modules/login/login.component').then((m) => m.LoginComponent),
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
          import('../modules/home/home.component').then((m) => m.HomeComponent),
        canActivate: [AuthGuard],
      },
      { path: '', redirectTo: '/home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('../modules/home/home.component').then((m) => m.HomeComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('../modules/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'services',
        loadComponent: () =>
          import(
            '../modules/services/pages/services-list/services-list.component'
          ).then((m) => m.ServicesListComponent),
        canActivate: [AuthGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers',
        loadComponent: () =>
          import(
            '../modules/customers/pages/customers-list/customers-list.component'
          ).then((m) => m.CustomersListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/create',
        loadComponent: () =>
          import(
            '../modules/customers/pages/customer-create/customer-create.component'
          ).then((m) => m.CustomerCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import(
            '../modules/customers/pages/customer-view/customer-view.component'
          ).then((m) => m.CustomerViewComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () =>
          import(
            '../modules/customers/pages/customer-edit/customer-edit.component'
          ).then((m) => m.CustomerEditComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users',
        loadComponent: () =>
          import('../modules/users/pages/users-list/users-list.component').then(
            (m) => m.UsersComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import(
            '../modules/users/pages/user-create/user-create.component'
          ).then((m) => m.UserCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('../modules/users/pages/user-edit/user-edit.component').then(
            (m) => m.UserEditComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('../modules/users/pages/user-view/user-view.component').then(
            (m) => m.UserViewComponent
          ),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('../modules/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../modules/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import(
            '../modules/tenants/pages/tenant-list/tenant-list.component'
          ).then((m) => m.TenantListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN] },
      },
      {
        path: 'tenants/create',
        loadComponent: () =>
          import(
            '../modules/tenants/pages/tenant-create/tenant-create.component'
          ).then((m) => m.TenantCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.ADMIN] },
      },
    ],
  },
];
