import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

// Interface para tipar o erro que vem do NestJS (opcional, mas boa prática)
export interface BackendError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router); // Injetamos apenas o Router para evitar ciclo com AuthService

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Ocorreu um erro inesperado. Tente novamente.';

      // 1. Tratamento de Mensagem do Backend (NestJS Standard)
      if (error.error) {
        const backendError = error.error as BackendError | string;

        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (typeof backendError === 'object' && backendError.message) {
          errorMessage = Array.isArray(backendError.message)
            ? backendError.message.join(', ')
            : backendError.message;
        }
      }

      // 2. Tratamento por Status Code (Lógica de Negócio e Segurança)
      switch (error.status) {
        case 401: // Unauthorized (Token expirado ou inválido)
          errorMessage = 'Sessão expirada. Faça login novamente.';
          // Ação de Logout Forçado Manual (Safe approach)
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          router.navigate(['/login']);
          break;

        case 403: // Forbidden
          errorMessage =
            'Acesso negado. Você não tem permissão para realizar esta ação.';
          break;

        case 404:
          // Opcional: não mostrar erro global para 404 se a tela tratar individualmente
          errorMessage = 'Recurso não encontrado.';
          break;

        case 422: // Unprocessable Entity (Validation)
          // Geralmente mantemos a mensagem original do backend
          break;

        case 500:
          errorMessage =
            'Erro interno do servidor. Nossa equipe já foi notificada.';
          break;

        case 0:
          errorMessage = 'Sem conexão com a internet. Verifique sua rede.';
          break;
      }

      // 3. Retorna o erro tratado para o componente exibir no Toast ou Input
      const treatedError = new HttpErrorResponse({
        error: {
          ...error.error,
          message: errorMessage,
          treatedMessage: errorMessage,
        }, // Compatibilidade
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
      });

      return throwError(() => treatedError);
    })
  );
};
