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
  legalNature?: 'PERSON_PHYSICAL' | 'PERSON_LEGAL';
  cpf?: string;
  cnpj?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
