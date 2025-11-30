import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs/operators';
import { Role } from '../enum/roles.enum';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se está autenticado
  if (!authService.isAuthenticated()) {
    // Se tentar acessar área de cliente sem logar, manda pro login do cliente
    if (state.url.includes('/portal')) {
      return router.createUrlTree(['/portal/login']);
    }
    // Padrão: manda pro login administrativo
    return router.createUrlTree(['/login']);
  }

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      // 1. Se não tiver usuário carregado (erro de estado), logout
      if (!user) {
        authService.logout();
        return router.createUrlTree(['/login']);
      }

      // 2. Troca de senha obrigatória
      const isChangePasswordRoute = state.url.includes('/change-password');
      if (user.mustChangePassword && !isChangePasswordRoute) {
        return router.createUrlTree(['/change-password']);
      }

      // 3. Redirecionamento de Contexto (Segurança de Navegação)
      const isClient = user.role === Role.CLIENT;
      const tryingToAccessPortal = state.url.includes('/portal');

      // Cenário A: Cliente tentando acessar área administrativa
      if (isClient && !tryingToAccessPortal && !isChangePasswordRoute) {
        return router.createUrlTree(['/portal/home']);
      }

      // Cenário B: Admin/Gestor tentando acessar área do portal
      if (!isClient && tryingToAccessPortal) {
        return router.createUrlTree(['/home']);
      }

      return true;
    })
  );
};
