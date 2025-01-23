import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { JwtModule, JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { jwtInterceptor } from './app/services/jwt.interceptor'; // Supondo que você tenha um interceptor

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
    provideHttpClient(withInterceptors([jwtInterceptor])), // Configurar HttpClient com interceptor
    FormsModule, // Formulários template-driven
    ReactiveFormsModule, // Formulários reativos
    {
      provide: JWT_OPTIONS,
      useValue: JWT_OPTIONS, // Usar o valor padrão
      useFactory: jwtOptionsFactory,
    }, // Configuração do JWT_OPTIONS
    JwtModule, // Registrar o JwtModule diretamente, sem .forRoot
    JwtHelperService, // Registrar o JwtHelperService
  ],
}).catch((err) => console.error(err));
