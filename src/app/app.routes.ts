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
        path: 'functionalities',
        loadComponent: () =>
          import(
            '../modules/functionalities/pages/functionalities-list/functionalities-list.component'
          ).then((m) => m.FunctionalitiesListComponent),
        canActivate: [AuthGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'functionalities/create',
        loadComponent: () =>
          import(
            '../modules/functionalities/pages/functionalities-create/functionalities-create.component'
          ).then((m) => m.FunctionalitiesCreateComponent),
        canActivate: [AuthGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'order/create',
        loadComponent: () =>
          import(
            '../modules/functionalities/pages/order-create/order-create.component'
          ).then((m) => m.OrderCreateComponent),
        canActivate: [AuthGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'services/:id',
        loadComponent: () =>
          import(
            '../modules/functionalities/pages/functionalities-view/functionalities-view.component'
          ).then((m) => m.FunctionalitiesViewComponent),
        canActivate: [AuthGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      // {
      //   path: 'functionalities/:id/edit',
      //   loadComponent: () =>
      //     import(
      //       '../modules/functionalities/pages/functionalities-edit/functionalities-edit.component'
      //     ).then((m) => m.FunctionalitiesEditComponent),
      //   canActivate: [AuthGuard],
      //   data: { roles: [Role.MANAGER_REVIEWERS] },
      // },
      {
        path: 'clients',
        loadComponent: () =>
          import(
            '../modules/clients/pages/clients-list/clients-list.component'
          ).then((m) => m.ClientsListComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'clients/create',
        loadComponent: () =>
          import(
            '../modules/clients/pages/clients-create/clients-create.component'
          ).then((m) => m.ClientsCreateComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'clients/:id',
        loadComponent: () =>
          import(
            '../modules/clients/pages/clients-view/clients-view.component'
          ).then((m) => m.ClientsViewComponent),
        canActivate: [AuthGuard, RoleGuard],
        data: { roles: [Role.MANAGER_REVIEWERS] },
      },
      {
        path: 'clients/:id/edit',
        loadComponent: () =>
          import(
            '../modules/clients/pages/clients-edit/clients-edit.component'
          ).then((m) => m.ClientsEditComponent),
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
