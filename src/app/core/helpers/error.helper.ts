import { HttpErrorResponse } from '@angular/common/http';

export interface BackendError {
  message: string | string[];
  error: string;
  statusCode: number;
  treatedMessage?: string;
}

export class ErrorHelper {
  /**
   * Extrai a mensagem de erro tratada do HttpErrorResponse
   * @param error - O erro retornado do backend
   * @returns A mensagem de erro formatada para exibição
   */
  static getErrorMessage(error: any): string {
    // Se é um HttpErrorResponse
    if (error instanceof HttpErrorResponse) {
      // Se o interceptor já tratou o erro
      if (error.error?.treatedMessage) {
        return error.error.treatedMessage;
      }

      // Se não foi tratado pelo interceptor, trata aqui
      if (error.error) {
        const backendError: BackendError = error.error;

        if (backendError.message) {
          if (Array.isArray(backendError.message)) {
            return backendError.message.join(', ');
          } else {
            return backendError.message;
          }
        } else if (typeof error.error === 'string') {
          return error.error;
        }
      }

      // Fallback baseado no status
      switch (error.status) {
        case 401:
          return 'Não autorizado. Faça login novamente.';
        case 403:
          return 'Acesso negado. Você não tem permissão para esta ação.';
        case 404:
          return 'Recurso não encontrado.';
        case 500:
          return 'Erro interno do servidor. Tente novamente mais tarde.';
        case 0:
          return 'Erro de conexão. Verifique sua internet.';
        default:
          return error.message || 'Erro desconhecido.';
      }
    }

    // Se é um erro simples
    if (typeof error === 'string') {
      return error;
    }

    // Se é um objeto com mensagem
    if (error?.message) {
      if (Array.isArray(error.message)) {
        return error.message.join(', ');
      }
      return error.message;
    }

    // Fallback
    return 'Erro desconhecido.';
  }

  /**
   * Verifica se o erro é de validação (422)
   * @param error - O erro retornado do backend
   * @returns true se for erro de validação
   */
  static isValidationError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status === 422;
  }

  /**
   * Verifica se o erro é de autenticação (401)
   * @param error - O erro retornado do backend
   * @returns true se for erro de autenticação
   */
  static isAuthError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status === 401;
  }

  /**
   * Verifica se o erro é de autorização (403)
   * @param error - O erro retornado do backend
   * @returns true se for erro de autorização
   */
  static isAuthorizationError(error: any): boolean {
    return error instanceof HttpErrorResponse && error.status === 403;
  }
}
