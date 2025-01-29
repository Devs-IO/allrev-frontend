import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
//import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, /*FooterComponent*/],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {

  sidebarOpen = true;
  isCollapsed = signal(false); // Estado para menu aberto/fechado
  
  toggleSidebar() {
    this.isCollapsed.update(state => !state); // Alterna o estado do menu lateral
  }

}
