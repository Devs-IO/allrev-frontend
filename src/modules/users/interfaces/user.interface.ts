import { Role } from '../../../app/core/enum/roles.enum';

export interface User {
  id: string;
  role: Role;
}
