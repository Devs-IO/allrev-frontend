import { Role } from '../interfaces/user.enums';

export interface CreateUserDto {
  email: string;
  photo?: string;
  password: string;
  currentPassword?: string; // Para validação ao alterar senha
  role: Role;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  tenant?: any; // Ajuste conforme CreateTenantDto
  tenantId?: string;
}

export interface ResponseUserDto {
  // Dados do usuário
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  photo?: string;
  role: Role | string; // Permite tanto enum quanto string para compatibilidade
  isActive: boolean;
  tenantId: string;
  createdAt: Date;

  // Dados do tenant agrupados
  tenant?: {
    id: string;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyEmail?: string;
    logo?: string;
    code?: string;
    paymentDueDate?: string | Date;
    paymentFrequency?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    name?: string;
  };
}
