import { PaymentStatus, PaymentMethod, PaymentFrequency } from './tenant.enums';

export interface CreateTenantDto {
  code: string;
  companyName: string;
  address: string;
  phone: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  isActive: boolean;
  paymentFrequency: PaymentFrequency;
  paymentDueDate: Date;
  logo?: string;
  description?: string;
}

export interface Tenant extends CreateTenantDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
