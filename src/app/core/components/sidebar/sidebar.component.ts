import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from  '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, CommonModule], // Importando roteamento para usar RouterLink
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  collapsed = false;
  openSubmenus: { [key: string]: boolean } = {};
  activeSubmenu = signal<string | null>(null);
  currentDate = signal(new Date()); // Estado para exibir a data/hora
  userName = signal('Usuário Exemplo'); // Simulando o nome do usuário logado

  ngOnInit() {
    // Atualiza a hora a cada segundo
    setInterval(() => {
      this.currentDate.set(new Date());
    }, 1000);
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  toggleSubmenu(menu: string) {
    if (!this.collapsed) {
      this.openSubmenus[menu] = !this.openSubmenus[menu];
    }
  }

  isCollapsed(): boolean {
    return this.collapsed;
  }

  isOpen(menu: string): boolean {
    return this.openSubmenus[menu];
  }
}
