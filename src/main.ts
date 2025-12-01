import { bootstrapApplication } from '@angular/platform-browser';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

// Auth & JWT
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';

// State Management (NgRx)
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEffects } from '@ngrx/effects';

// Local Files
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';
import { appReducers } from './app/core/state/app.state';
import { AuthEffects } from './app/core/state/auth/auth.effects';

// Interceptors (Funcionais)
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';

// Registrar locale pt-BR
registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  providers: [
    // 1. Configuração de Rotas (com bindings modernos e transições)
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),

    // 2. Cliente HTTP com Interceptors Funcionais (Ordem importa!)
    provideHttpClient(
      withInterceptors([
        jwtInterceptor, // 1º: Anexa o Token
        errorInterceptor, // 2º: Trata o Erro (Logout se 401)
      ])
    ),

    // 3. State Management (Store & Effects)
    provideStore(appReducers),
    provideEffects([AuthEffects]),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production, // Desabilita log em produção para performance
      autoPause: true,
    }),

    // 4. JWT Helper (Apenas o serviço utilitário, pois o interceptor é manual)
    { provide: JWT_OPTIONS, useValue: JWT_OPTIONS },
    JwtHelperService,

    // 5. Configurações Globais (Locale e Animações)
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideAnimations(), // Necessário para Toastr e alguns componentes UI
  ],
}).catch((err) => console.error(err));
