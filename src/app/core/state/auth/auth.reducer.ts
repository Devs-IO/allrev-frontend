import { createReducer, on } from '@ngrx/store';
import { login, loginSuccess, loginFailure } from './auth.actions';

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  error: string | null;
}

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(login, state => ({ ...state, error: null })),
  on(loginSuccess, (state, { token, user }) => ({
    ...state,
    isAuthenticated: true,
    user,
    token,
  })),
  on(loginFailure, (state, { error }) => ({
    ...state,
    error,
  }))
);
