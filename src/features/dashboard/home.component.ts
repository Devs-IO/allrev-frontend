import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../app/core/services/auth.service';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { Role } from '../../app/core/enum/roles.enum';
import { OrdersService } from '../operations/orders/services/orders.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  // Observables para cada papel
  adminStats$!: Observable<any>;
  managerStats$!: Observable<any>;
  assistantStats$!: Observable<any>;

  // Flags de papel
  currentDate = new Date();
  isAdmin = false;
  isManager = false;
  isAssistant = false;

  private userSub!: Subscription;

  constructor(
    private ordersService: OrdersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      if (!user) return;

      const userRole = user.role;

      // Determina qual dashboard exibir baseado no role
      if (userRole === Role.ADMIN) {
        this.isAdmin = true;
        this.isManager = false;
        this.isAssistant = false;
        // Carrega dados do admin dashboard
        this.adminStats$ = this.ordersService.getAdminDashboard().pipe(
          shareReplay(1),
          catchError((err) => {
            console.error('Erro ao carregar dashboard admin', err);
            return of({
              activeTenants: 0,
              totalUsers: 0,
              overduePayments: 0,
            });
          })
        );
      } else if (userRole === Role.MANAGER_REVIEWERS) {
        this.isAdmin = false;
        this.isManager = true;
        this.isAssistant = false;
        // Carrega dashboard do gestor com dados financeiros
        this.managerStats$ = this.ordersService.getDashboardSummary().pipe(
          shareReplay(1),
          catchError((err) => {
            console.error('Erro ao carregar dashboard gestor', err);
            return of({
              totalOrders: 0,
              revenue: 0,
              cost: 0,
              netProfit: 0,
              margin: 0,
              overdueItemsCount: 0,
              paymentStats: [],
              workStats: [],
            });
          })
        );
      } else if (userRole === Role.ASSISTANT_REVIEWERS) {
        this.isAdmin = false;
        this.isManager = false;
        this.isAssistant = true;
        // Carrega dashboard do assistente com suas tarefas
        this.assistantStats$ = this.ordersService.getDashboardSummary().pipe(
          map((response: any) => {
            // Assistente vê seus pedidos específicos
            const pendingCount =
              response.workStats?.find((s: any) => s.status === 'PENDING')
                ?.count || 0;
            const inProgressCount =
              response.workStats?.find((s: any) => s.status === 'IN_PROGRESS')
                ?.count || 0;
            const completedCount =
              response.workStats?.find(
                (s: any) => s.status === 'COMPLETED' || s.status === 'FINISHED'
              )?.count || 0;

            return {
              pendingCount,
              inProgressCount,
              completedCount,
              overdueCount: response.overdueItemsCount || 0,
              totalOrders: response.totalOrders || 0,
            };
          }),
          shareReplay(1),
          catchError((err) => {
            console.error('Erro ao carregar dashboard assistente', err);
            return of({
              pendingCount: 0,
              inProgressCount: 0,
              completedCount: 0,
              overdueCount: 0,
              totalOrders: 0,
            });
          })
        );
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userSub) this.userSub.unsubscribe();
  }

  get greeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }
}
