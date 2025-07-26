export type ServiceDefinitionDto = {
  id: string;
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceDto = {
  name: string;
  description?: string;
  minimumPrice: number;
  defaultAssistantPrice?: number;
  status?: 'ACTIVE' | 'INACTIVE';
  responsibleUserId: string;
};
