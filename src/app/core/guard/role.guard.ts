import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../enum/roles.enum';
import { map, take } from 'rxjs/operators';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const requiredRoles = route.data['roles'] as Role[];

  return authService.currentUser$.pipe(
    take(1),
    map((user) => {
      if (!user) return false;

      // Se não houver roles definidas na rota, permite acesso (ou bloqueia, dependendo da estratégia. Aqui permitimos).
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      // Normaliza role do usuário para case-insensitive
      const userRole = (user.role as unknown as string)
        ?.toString()
        .toLowerCase();
      const required = (requiredRoles || []).map((r) =>
        r.toString().toLowerCase()
      );
      const hasPermission = required.includes(userRole);

      if (!hasPermission) {
        toast.error(
          'Acesso negado: Você não tem permissão para acessar esta página.'
        );

        // Redireciona para a home adequada
        if (userRole === Role.CLIENT) {
          router.navigate(['/portal/home']);
        } else {
          router.navigate(['/home']);
        }
        return false;
      }

      return true;
    })
  );
};
