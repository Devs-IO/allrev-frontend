export interface FunctionalityDto {
  id: string;
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFunctionalityDto {
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
}

export interface ResponsibleUser {
  id: string;
  name: string;
}
