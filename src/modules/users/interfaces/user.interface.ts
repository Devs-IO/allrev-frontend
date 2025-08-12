import { Role } from '../../../app/core/enum/roles.enum';

export interface UserTenantLink {
  tenantId: string;
  role: Role;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  role: Role;
  isAdmin: boolean;
  // Mantido para compatibilidade antiga
  tenantIds?: string[];
  // Novo formato detalhado vindo do backend
  tenants?: UserTenantLink[];
}
