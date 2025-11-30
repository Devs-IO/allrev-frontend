export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  course?: string;
  university?: string;
  phone?: string;
  observation?: string;
  note?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
