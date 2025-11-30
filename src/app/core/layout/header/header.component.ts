import { Component, inject, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { Role } from '../../enum/roles.enum';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);

  userName: string = '';
  userRole: string = '';
  isAdmin: boolean = false;

  private userSubscription?: Subscription;

  ngOnInit() {
    // Escuta as mudanças no usuário atual de forma reativa
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.userName = user.name;
        this.userRole = user.role;
        this.isAdmin = user.role === Role.ADMIN;

        // Adiciona classe no body para estilos específicos de Admin, se necessário
        if (this.isAdmin) {
          this.renderer.addClass(document.body, 'admin-logged-in');
        } else {
          this.renderer.removeClass(document.body, 'admin-logged-in');
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Boa prática: limpa a inscrição quando o componente é destruído
    this.userSubscription?.unsubscribe();
  }

  logout() {
    this.renderer.removeClass(document.body, 'admin-logged-in');
    this.authService.logout();
    // O redirecionamento já é feito no service, mas por segurança mantemos aqui se necessário
  }
}
