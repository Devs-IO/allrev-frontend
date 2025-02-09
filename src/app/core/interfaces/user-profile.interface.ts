export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    photo: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    tenantId: string;
    tenantCompanyName: string;
    tenantCode: string;
    tenantPaymentStatus: string;
    tenantPaymentMethod: string;
    tenantPaymentFrequency: string;
    tenantPaymentDueDate: string;

  }
  