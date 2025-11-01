import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const token = localStorage.getItem('token'); // Pega o token armazenado
  // Best-effort tenant extraction from persisted user
  let tenantId: string | undefined;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const u = JSON.parse(userStr);
      tenantId =
        u?.tenant?.id ||
        u?.tenantId ||
        u?.tenants?.[0]?.tenantId ||
        u?.tenants?.[0]?.id;
    }
  } catch {
    // ignore parse errors
  }

  // if (process.env.NODE_ENV === 'development') {
  //   console.log('JWT Interceptor - URL:', req.url);
  //   console.log('JWT Interceptor - Token exists:', !!token);
  // }

  if (token) {
    const setHeaders: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (tenantId) setHeaders['X-Tenant-Id'] = String(tenantId);

    const clonedReq = req.clone({ setHeaders });
    //console.log('JWT Interceptor - Added Bearer token to request');
    return next(clonedReq);
  }

  // console.log(
  //   'JWT Interceptor - No token found, proceeding without auth header'
  // );
  return next(req);
};
