import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { User } from '../../../../features/admin/users/interfaces/user.interface';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
  isLoading: boolean;
}

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
  isLoading: false,
};

export const authReducer = createReducer(
  initialState,

  // --- Requests (Inicia Loading) ---
  on(AuthActions.loginRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),
  on(AuthActions.loginClientRequest, (state) => ({
    ...state,
    isLoading: true,
    error: null,
  })),

  // --- Success (Salva dados) ---
  on(AuthActions.loginSuccess, (state, { response }) => ({
    ...state,
    isAuthenticated: true,
    user: response.user,
    token: response.accessToken,
    isLoading: false,
    error: null,
  })),

  // --- Failure (Reseta e mostra erro) ---
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error,
  })),

  // --- Logout (Limpa tudo) ---
  on(AuthActions.logout, () => ({
    ...initialState,
  })),

  // --- Restore Session ---
  on(AuthActions.restoreSession, (state, { user, token }) => ({
    ...state,
    isAuthenticated: true,
    user,
    token,
    isLoading: false,
  }))
);
