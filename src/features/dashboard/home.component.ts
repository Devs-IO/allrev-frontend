import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrdersService } from '../operations/orders/services/orders.service';
import { Observable, shareReplay } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  stats$!: Observable<any>;
  currentDate = new Date();

  constructor(private ordersService: OrdersService) {}

  ngOnInit(): void {
    this.stats$ = this.ordersService.getDashboardSummary().pipe(shareReplay(1));
  }

  // Helper para saudações baseadas no horário
  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}
