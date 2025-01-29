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
  isCollapsed = signal(false); // Estado para controle do menu aberto/fechado
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
    this.isCollapsed.update(state => !state); // Alterna o estado do menu lateral
  }

  toggleSubmenu(menu: string) {
    this.activeSubmenu.set(this.activeSubmenu() === menu ? null : menu);
  }
}
