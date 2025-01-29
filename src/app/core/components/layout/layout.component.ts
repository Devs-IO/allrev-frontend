import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
//import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, /*FooterComponent*/],
  template: `
    <div class="layout">
      <app-sidebar></app-sidebar>
      
      <div class="layout-content">

        <div class="main-content">
        <app-header></app-header>
          <router-outlet></router-outlet>
        </div>
      </div>
      <!-- <app-footer></app-footer> -->
    </div>
  `,
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {}
