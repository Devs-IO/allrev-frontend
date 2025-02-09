import { Component, signal, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from  '@angular/common'; 
import { RouterModule } from '@angular/router';
import { interval, map, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule], // Importando roteamento para usar RouterLink
  standalone: true,
  templateUrl: './sidebar.component copy.html',
  styleUrls: ['./sidebar.component copy.scss'],
})
export class SidebarComponent implements OnInit {
  @Output() toggle = new EventEmitter<void>(); // Emite evento ao alternar
  
  collapsed = true; // Estado do menu lateral
  openSubmenus: { [key: string]: boolean } = {};
  activeSubmenu = signal<string | null>(null);
  currentDate = signal(new Date()); // Estado para exibir a data/hora
  userName = signal('Usuário Exemplo'); // Simulando o nome do usuário logado
  private destroy$ = new Subject<void>();

  ngOnInit() {
    // Atualiza a hora a cada segundo
    interval(1000)
      .pipe(
        map(() => new Date()),
        takeUntil(this.destroy$)
      )
      .subscribe(date => this.currentDate.set(date));
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
    this.toggle.emit(); // Dispara evento para atualizar layout

    console.log('Menu lateral:', this.collapsed ? 'fechado' : 'aberto');
    // Se o menu for fechado, limpa os submenus abertos
    if (this.collapsed) {
      this.activeSubmenu.set(null);
    }
  }

  toggleSubmenu(menu: string) {
    if (!this.collapsed) {
      this.activeSubmenu.set(
        this.activeSubmenu() === menu ? null : menu
      );
    }
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  isOpen(menu: string): boolean {
    return this.activeSubmenu() === menu;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
