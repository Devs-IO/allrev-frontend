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
  stats$!: Observable<any>;
  assistantStats$!: Observable<any>;

  currentDate = new Date();
  isManager = false;
  isAdmin = false;
  adminStats = { activeTenants: 0, totalUsers: 0, overduePayments: 0 };

  private userSub!: Subscription;

  constructor(
    private ordersService: OrdersService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Usar currentUser$ (Observable) é mais seguro que take(1) para recargas de página
    this.userSub = this.authService.currentUser$.subscribe((user) => {
      if (!user) return;

      const userRole = user.role;

      // Identifica se é ADMIN
      if (userRole === Role.ADMIN) {
        this.isAdmin = true;
        this.isManager = false;
        // Admin não carrega dados de dashboard operacional
        // Valores placeholder para admin
        this.adminStats = {
          activeTenants: 0,
          totalUsers: 0,
          overduePayments: 0,
        };
        return;
      }

      this.isAdmin = false;

      // Verifica se é Gestor
      this.isManager = userRole === Role.MANAGER_REVIEWERS;

      if (this.isManager) {
        // --- VISÃO GESTOR (Carrega Dashboard Financeiro) ---
        this.stats$ = this.ordersService.getDashboardSummary().pipe(
          shareReplay(1),
          catchError((err) => {
            console.error('Erro ao carregar dashboard gerente', err);
            return of(null);
          })
        );
      } else {
        // --- VISÃO ASSISTENTE (Carrega Contagem de Tarefas) ---
        this.assistantStats$ = this.ordersService
          .list({ page: 1, pageSize: 100 }) // Lista as ordens (o backend já deve filtrar por user)
          .pipe(
            map((response: any) => {
              const orders = response.data || [];

              // Contadores simples baseados no status da ordem (ou item)
              // Idealmente o backend teria um endpoint /dashboard/assistant-summary
              const pending = orders.filter(
                (o: any) => o.workStatus === 'PENDING'
              ).length;
              const inProgress = orders.filter(
                (o: any) => o.workStatus === 'IN_PROGRESS'
              ).length;
              const completed = orders.filter(
                (o: any) =>
                  o.workStatus === 'FINISHED' || o.workStatus === 'COMPLETED'
              ).length;

              return {
                pendingCount: pending,
                inProgressCount: inProgress,
                completedThisMonth: completed,
                nextDeadlines: [], // Implementar lógica de extração de itens depois
              };
            }),
            // Em caso de erro, retorna zerado para não quebrar a tela
            catchError(() =>
              of({
                pendingCount: 0,
                inProgressCount: 0,
                completedThisMonth: 0,
                nextDeadlines: [],
              })
            )
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
