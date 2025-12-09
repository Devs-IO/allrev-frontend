import { Routes } from '@angular/router';
import { authGuard } from './core/guard/auth.guard';
import { roleGuard } from './core/guard/role.guard';
import { Role } from './core/enum/roles.enum';

export const routes: Routes = [
  // ==========================================
  // 1. ROTAS PÚBLICAS
  // ==========================================
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () =>
      import('../features/admin/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
    title: 'Login - AllRev',
  },

  // Login Específico do Portal do Cliente
  {
    path: 'portal/login',
    loadComponent: () =>
      import(
        '../features/portal/pages/portal-login/portal-login.component'
      ).then((m) => m.PortalLoginComponent),
    title: 'Acesso do Cliente',
  },

  // ==========================================
  // 2. ROTAS COMUNS (Autenticadas)
  // ==========================================
  {
    path: 'change-password',
    loadComponent: () =>
      import(
        '../features/admin/auth/pages/change-password/change-password.component'
      ).then((m) => m.ChangePasswordComponent),
    canActivate: [authGuard],
    title: 'Alterar Senha',
  },

  // ==========================================
  // 3. PORTAL DO CLIENTE (Layout Exclusivo)
  // ==========================================
  {
    path: 'portal',
    // Futuro: loadComponent: () => import('./modules/portal/layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    // Por enquanto, usaremos router-outlet direto ou um layout temporário se ainda não existir
    canActivate: [authGuard, roleGuard],
    data: { roles: [Role.CLIENT] },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('../features/portal/pages/home/home.component').then(
            (m) => m.PortalHomeComponent
          ),
        title: 'Portal do Cliente',
      },
      // Futuro: { path: 'orders', ... }
    ],
  },

  // ==========================================
  // 4. ÁREA ADMINISTRATIVA (Admin, Gestor, Assistente)
  // ==========================================
  {
    path: '', // Rota base para usuários internos (Layout com Sidebar)
    loadComponent: () =>
      import('./core/layout/layout/layout.component').then(
        (m) => m.LayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    // O roleGuard aqui bloqueia clientes de entrarem no layout administrativo
    data: {
      roles: [Role.ADMIN, Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS],
    },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // --- Dashboard ---
      {
        path: 'home',
        loadComponent: () =>
          import('../features/dashboard/home.component').then(
            (m) => m.HomeComponent
          ),
        title: 'Dashboard',
      },

      // --- Dashboard Admin (Visão Global) ---
      {
        path: 'admin/home',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        loadComponent: () =>
          import(
            '../features/admin/pages/admin-home/admin-home.component'
          ).then((m) => m.AdminHomeComponent),
        title: 'Dashboard Admin',
      },

      // --- Perfil ---
      {
        path: 'profile',
        loadComponent: () =>
          import('../features/admin/auth/pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        title: 'Meu Perfil',
      },

      // --- Empresas (Tenants) - Apenas ADMIN ---
      {
        path: 'tenants',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        loadComponent: () =>
          import(
            '../features/admin/tenants/pages/tenant-list/tenant-list.component'
          ).then((m) => m.TenantListComponent),
        title: 'Empresas',
      },
      {
        path: 'tenants/create',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        loadComponent: () =>
          import(
            '../features/admin/tenants/pages/tenant-create/tenant-create.component'
          ).then((m) => m.TenantCreateComponent),
        title: 'Nova Empresa',
      },
      {
        path: 'tenants/:id',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        loadComponent: () =>
          import(
            '../features/admin/tenants/pages/tenant-view/tenant-view.component'
          ).then((m) => m.TenantViewComponent),
        title: 'Detalhes da Empresa',
      },
      {
        path: 'tenants/:id/edit',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN] },
        loadComponent: () =>
          import(
            '../features/admin/tenants/pages/tenant-edit/tenant-edit.component'
          ).then((m) => m.TenantEditComponent),
        title: 'Editar Empresa',
      },

      // --- Usuários (Admins vêem tudo, Gestores vêem seus assistentes) ---
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/admin/users/pages/users-list/users-list.component'
          ).then((m) => m.UsersListComponent),
        title: 'Usuários',
      },
      {
        path: 'users/create',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/admin/users/pages/user-create/user-create.component'
          ).then((m) => m.UserCreateComponent),
        title: 'Novo Usuário',
      },
      {
        path: 'users/:id/edit',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/admin/users/pages/user-edit/user-edit.component'
          ).then((m) => m.UserEditComponent),
        title: 'Editar Usuário',
      },

      // --- Clientes (Gestão) ---
      {
        path: 'clients',
        canActivate: [roleGuard],
        data: {
          roles: [Role.ADMIN, Role.MANAGER_REVIEWERS, Role.ASSISTANT_REVIEWERS],
        }, // Assistente pode ver? Definido como Leitura na matriz
        loadComponent: () =>
          import(
            '../features/operations/clients/pages/clients-list/clients-list.component'
          ).then((m) => m.ClientsListComponent),
        title: 'Clientes',
      },
      {
        path: 'clients/create',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] }, // Assistente não cria
        loadComponent: () =>
          import(
            '../features/operations/clients/pages/clients-create/clients-create.component'
          ).then((m) => m.ClientsCreateComponent),
        title: 'Novo Cliente',
      },
      {
        path: 'clients/:id/edit',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/operations/clients/pages/clients-edit/clients-edit.component'
          ).then((m) => m.ClientsEditComponent),
        title: 'Editar Cliente',
      },

      // --- Ordens de Serviço (Trabalhos) ---
      {
        path: 'orders',
        loadComponent: () =>
          import(
            '../features/operations/orders/pages/orders-list/orders-list.component'
          ).then((m) => m.OrdersListComponent),
        title: 'Trabalhos',
      },
      {
        path: 'orders/create',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] }, // Assistente cria? Geralmente sim, ajustar se necessário
        loadComponent: () =>
          import(
            '../features/operations/orders/pages/orders-create/orders-create.component'
          ).then((m) => m.OrdersCreateComponent),
        title: 'Novo Trabalho',
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import(
            '../features/operations/orders/pages/orders-detail/orders-detail.component'
          ).then((m) => m.OrdersDetailComponent),
        title: 'Detalhes do Trabalho',
      },

      // --- Funcionalidades (Catálogo de Serviços) ---
      {
        path: 'functionalities',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/operations/functionalities/pages/functionalities-list/functionalities-list.component'
          ).then((m) => m.FunctionalitiesListComponent),
        title: 'Catálogo de Serviços',
      },
      {
        path: 'functionalities/create',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/operations/functionalities/pages/functionalities-create/functionalities-create.component'
          ).then((m) => m.FunctionalitiesCreateComponent),
        title: 'Novo Serviço',
      },
      {
        path: 'functionalities/:id/edit',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import(
            '../features/operations/functionalities/pages/functionalities-edit/functionalities-edit.component'
          ).then((m) => m.FunctionalitiesEditComponent),
        title: 'Editar Serviço',
      },

      // --- Relatórios e Configurações ---
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import('../features/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
        title: 'Relatórios',
      },
      {
        path: 'settings',
        canActivate: [roleGuard],
        data: { roles: [Role.ADMIN, Role.MANAGER_REVIEWERS] },
        loadComponent: () =>
          import('../features/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
        title: 'Configurações',
      },
    ],
  },

  // Rota Coringa (404) -> Redireciona para login ou home
  { path: '**', redirectTo: 'login' },
];
