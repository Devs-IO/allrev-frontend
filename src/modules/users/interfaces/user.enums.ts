import { Role } from '../../../app/core/enum/roles.enum';

export const RoleLabels = {
  [Role.ADMIN]: 'Administrador',
  [Role.USER]: 'Usuário',
  [Role.MANAGER_REVIEWERS]: 'Gestor de Revisores',
  [Role.CLIENT]: 'Cliente',
  [Role.ASSISTANT_REVIEWERS]: 'Assistente de Revisores',
  [Role.NONE]: 'Nenhum',
};

export { Role };
