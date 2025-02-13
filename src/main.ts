import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { JwtModule, JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { provideStore } from '@ngrx/store'; // Supondo que você tenha um interceptor
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { appReducers } from './app/core/state/app.state';
import { provideEffects } from '@ngrx/effects';
import { AuthEffects } from './app/core/state/auth/auth.effects';
import { AuthInterceptor } from './app/core/interceptors/auth.interceptor';
import { PhoneMaskPipe } from './app/core/pipe/phone-mask.pipe';

// Função para fornecer as opções de configuração do JWT
export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('token'), // Recuperar o token do localStorage
    allowedDomains: ['localhost:3000'], // Domínios permitidos
    disallowedRoutes: ['http://localhost:3000/auth/login'], // Rotas que não precisam de autenticação
  };
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Registrar as rotas
    provideStore(appReducers), // Configura os reducers
    provideEffects([AuthEffects]), // Adiciona os efeitos (vazio inicialmente)
    provideHttpClient(withInterceptors([jwtInterceptor])), // Configurar HttpClient com interceptor
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    FormsModule, // Formulários template-driven
    ReactiveFormsModule, // Formulários reativos
    {
        provide: JWT_OPTIONS,
        useValue: JWT_OPTIONS, // Usar o valor padrão
        useFactory: jwtOptionsFactory,
    }, // Configuração do JWT_OPTIONS
    JwtModule, // Registrar o JwtModule diretamente, sem .forRoot
    JwtHelperService,
    provideStore(),
    provideStoreDevtools({
      maxAge: 25, // Limita o histórico de ações
      //logOnly: !environment.production, // Apenas visualização em produção
    }),
  ],
}).catch((err) => console.error(err));
