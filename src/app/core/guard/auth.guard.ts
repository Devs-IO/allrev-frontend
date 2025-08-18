import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree {
    const targetUrl = state.url || '';
    const isAuth = this.authService.isAuthenticated();
    if (!isAuth) {
      // allow access to /login when not authenticated, block others
      if (targetUrl.startsWith('/login')) return true;
      return this.router.createUrlTree(['/login']);
    }

    // Enforce password change if required
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const mustChange = user?.mustChangePassword === true;
    const onChangePasswordRoute = targetUrl.startsWith('/change-password');
    if (mustChange && !onChangePasswordRoute) {
      return this.router.createUrlTree(['/change-password']);
    }

    // If authenticated and trying to access /login, send to home
    if (targetUrl.startsWith('/login')) {
      return this.router.createUrlTree(['/home']);
    }

    return true;
  }
}
