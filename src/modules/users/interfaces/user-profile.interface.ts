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
  tenant: {
    id: string;
    companyName: string;
    code: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentFrequency: string;
    paymentDueDate: string;
  };
}
