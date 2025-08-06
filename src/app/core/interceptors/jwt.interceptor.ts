import { HttpInterceptorFn } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const token = localStorage.getItem('token'); // Pega o token armazenado

  if (process.env.NODE_ENV === 'development') {
    console.log('JWT Interceptor - URL:', req.url);
    console.log('JWT Interceptor - Token exists:', !!token);
  }

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    //console.log('JWT Interceptor - Added Bearer token to request');
    return next(clonedReq);
  }

  // console.log(
  //   'JWT Interceptor - No token found, proceeding without auth header'
  // );
  return next(req);
};
