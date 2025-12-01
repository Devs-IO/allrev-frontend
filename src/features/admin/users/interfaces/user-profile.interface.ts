export interface TenantDto {
  id: string;
  companyName: string;
  code: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentFrequency: string;
  paymentDueDate: string | Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  role: string; // backend enum string (e.g., 'admin' | 'manager_reviewers' | 'assistant_reviewers')
  isAdmin: boolean;
  tenant?: TenantDto | null;
  tenants?: { tenantId: string; role: string; companyName: string }[];
  photo?: string; // opcional
}
