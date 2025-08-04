import { inject, Injectable } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface BackendError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Erro interno do servidor';

      if (error.error) {
        const backendError: BackendError = error.error;

        // Se o erro tem o formato padrão do backend
        if (backendError.message) {
          if (Array.isArray(backendError.message)) {
            // Se é um array de mensagens, junta elas
            errorMessage = backendError.message.join(', ');
          } else {
            // Se é uma string simples
            errorMessage = backendError.message;
          }
        } else if (typeof error.error === 'string') {
          // Se o erro é uma string simples
          errorMessage = error.error;
        }
      }

      // Códigos de status específicos
      switch (error.status) {
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          errorMessage =
            'Acesso negado. Você não tem permissão para esta ação.';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado.';
          break;
        case 422:
          // Erros de validação - usa a mensagem do backend
          break;
        case 500:
          errorMessage =
            'Erro interno do servidor. Tente novamente mais tarde.';
          break;
        case 0:
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
      }

      // Retorna um novo erro com a mensagem tratada
      const treatedError = new HttpErrorResponse({
        error: { ...error.error, treatedMessage: errorMessage },
        headers: error.headers,
        status: error.status,
        statusText: error.statusText,
        url: error.url || undefined,
      });

      return throwError(() => treatedError);
    })
  );
};
