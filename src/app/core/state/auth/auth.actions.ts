import { createAction, props } from '@ngrx/store';
import { User } from '../../../../modules/users/interfaces/user.interface';
import { AuthResponse } from '../../services/auth.service';

// --- Login Administrativo (Admin, Gestor, Assistente) ---
export const loginRequest = createAction(
  '[Auth] Login Request',
  props<{ email: string; password: string }>()
);

// --- Login do Cliente (Portal) ---
export const loginClientRequest = createAction(
  '[Auth] Login Client Request',
  props<{ email: string; password: string }>()
);

// --- Resultados Comuns ---
export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ response: AuthResponse }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// --- Logout ---
export const logout = createAction('[Auth] Logout');

// --- Restauração de Sessão (Refresh da página) ---
export const restoreSession = createAction(
  '[Auth] Restore Session',
  props<{ user: User; token: string }>()
);
