import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  Renderer2,
  ElementRef,
  HostListener,
} from '@angular/core';
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
  private elementRef = inject(ElementRef);

  userName: string = '';
  userRole: string = '';
  tenantName: string = '';
  isAdmin: boolean = false;
  isDropdownOpen: boolean = false;

  private userSubscription?: Subscription;

  ngOnInit() {
    // Escuta as mudanças no usuário atual de forma reativa
    this.userSubscription = this.authService.currentUser$.subscribe(
      (user: any) => {
        if (user) {
          this.userName = user.name;
          this.userRole = user.role;
          this.isAdmin = user.role === Role.ADMIN;
          // Tenta pegar o nome da empresa de diferentes formas possíveis
          this.tenantName = user.tenant?.companyName || user.tenantName || '';

          // Adiciona classe no body para estilos específicos de Admin, se necessário
          if (this.isAdmin) {
            this.renderer.addClass(document.body, 'admin-logged-in');
          } else {
            this.renderer.removeClass(document.body, 'admin-logged-in');
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    // Boa prática: limpa a inscrição quando o componente é destruído
    this.userSubscription?.unsubscribe();
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  // Fecha o dropdown se clicar fora dele
  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  logout() {
    this.closeDropdown();
    this.renderer.removeClass(document.body, 'admin-logged-in');
    this.authService.logout();
    // O redirecionamento já é feito no service, mas por segurança mantemos aqui se necessário
  }
}
