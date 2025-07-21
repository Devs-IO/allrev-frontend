export interface CreateUserDto {
  email: string;
  photo?: string;
  password: string;
  role: string;
  name: string;
  phone: string;
  address: string;
  isActive: boolean;
  tenant?: any; // Ajuste conforme CreateTenantDto
  tenantId?: string;
}

export interface ResponseUserDto {
  id: string;
  role: string;
  tenantId: string;
  isActive: boolean;
  email: string;
  name: string;
  phone: string;
  address: string;
  photo?: string;
}
