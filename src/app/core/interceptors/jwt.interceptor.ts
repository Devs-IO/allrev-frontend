import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Clonamos os headers iniciais
  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);

    // Otimização: Tenta pegar o Tenant ID de forma segura sem quebrar se o JSON for inválido
    const tenantId = getTenantIdFromStorage();
    if (tenantId) {
      headers = headers.set('X-Tenant-Id', tenantId);
    }
  }

  const clonedReq = req.clone({ headers });
  return next(clonedReq);
};

// Função auxiliar para não poluir o interceptor principal
function getTenantIdFromStorage(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    const u = JSON.parse(userStr);
    // Prioridade: 1. tenantId direto, 2. objeto tenant.id, 3. primeiro da lista de tenants
    return u.tenantId || u.tenant?.id || u.tenants?.[0]?.id || null;
  } catch {
    return null;
  }
}
