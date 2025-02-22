import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../enum/roles.enum';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const user$ = this.authService.getUser(); // Obtém o usuário logado
    const requiredRoles: Role[] = route.data['roles'] || [];

    return user$.pipe(
      map(user => {
        if (user && requiredRoles.length === 0) {
          return true; // Se não houver restrição de roles, permite acesso
        } else if (user && requiredRoles.includes(user.role)) {
          return true;
        }
        return false; // Se não atender à condição, retorna false
      }),
      tap(hasAccess => {
        if (!hasAccess) {
          this.router.navigate(['/home']); // Redireciona se não tiver permissão
        }
      })
    );
  }
}
