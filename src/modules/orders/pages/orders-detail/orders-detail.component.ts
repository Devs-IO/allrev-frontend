import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  ChangeDetectorRef, // 1. Importar o ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersService } from '../../services/orders.service';
import { ToastService } from '../../../../app/core/services/toast.service';
import {
  OrderResponseDto,
  OrderInstallment,
  OrderItem,
} from '../../../../app/shared/models/orders';

@Component({
  selector: 'app-orders-detail',
  standalone: true,
  // 2. Remover DatePipe dos imports (não é usado no template)
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./orders-detail.component.scss'],
  templateUrl: './orders-detail.component.html',
})
export class OrdersDetailComponent implements OnInit {
  private orders = inject(OrdersService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);
  // 3. Injetar o ChangeDetectorRef
  private cdr = inject(ChangeDetectorRef);

  order?: OrderResponseDto;
  paying = false;
  private openState: Record<string, boolean> = {
    installments: true,
    items: true,
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.load(id);
    // restore open states
    const s = localStorage.getItem('orders.detail.sections');
    if (s) {
      try {
        this.openState = { ...this.openState, ...(JSON.parse(s) || {}) };
      } catch (e) {}
    }
  }

  load(id: string): void {
    this.orders.findOne(id).subscribe({
      next: (data) => {
        this.order = data;
        // 4. Chamar markForCheck() para atualizar a tela
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.toast.error('Erro ao carregar ordem');
        console.error(err);
      },
    });
  }

  // --- 5. NOVO: Getter para calcular o total a pagar às assistentes ---
  get totalAPagarAssistentes(): number {
    if (!this.order || !this.order.items) {
      return 0;
    }
    return this.order.items.reduce((total, item) => {
      // Soma apenas se 'responsible' e 'amount' existirem
      return total + (item.responsible?.amount || 0);
    }, 0);
  }

  // --- 6. NOVO: Getter para calcular o lucro estimado da gerente ---
  get lucroEstimado(): number {
    if (!this.order) {
      return 0;
    }
    return this.order.amountTotal - this.totalAPagarAssistentes;
  }

  // --- 7. NOVO: Função para verificar prazos e retornar alertas ---
  getDeadlineAlert(item: OrderItem): {
    class: string;
    icon: string;
    text: string;
  } {
    // Se o status for 'COMPLETED' ou 'CANCELED', não há alerta.
    const finalStati = ['COMPLETED', 'CANCELED'];
    if (finalStati.includes(item.itemStatus)) {
      return {
        class: 'text-success',
        icon: 'bi-check-circle',
        text: 'Finalizado',
      };
    }

    try {
      const deadline = new Date(item.clientDeadline);
      const today = new Date();
      // Ignora a hora, compara apenas as datas
      deadline.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          class: 'text-danger fw-bold',
          icon: 'bi-exclamation-triangle-fill',
          text: `Atrasado em ${Math.abs(diffDays)} dia(s)`,
        };
      }
      if (diffDays <= 3) {
        return {
          class: 'text-warning fw-bold',
          icon: 'bi-exclamation-triangle',
          text: `Vence em ${diffDays} dia(s)`,
        };
      }
      // Se falta mais de 3 dias, não mostra alerta
      return { class: '', icon: '', text: '' };
    } catch (e) {
      return { class: '', icon: '', text: '' }; // Em caso de data inválida
    }
  }

  getPaidPct(): number {
    if (!this.order) return 0;
    const total = this.order.amountTotal || 0;
    const paid = this.order.amountPaid || 0;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  toggle(key: 'installments' | 'items') {
    this.openState[key] = !this.openState[key];
    localStorage.setItem(
      'orders.detail.sections',
      JSON.stringify(this.openState)
    );
  }

  isOpen(key: 'installments' | 'items') {
    return !!this.openState[key];
  }

  formatPtBR(n: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(n || 0);
  }

  // Função para formatar data
  toPtDate(isoOrYmd: string | undefined | null): string {
    if (!isoOrYmd) return '—';
    try {
      // Tenta transformar '2025-10-30' em '30/10/2025'
      const m = String(isoOrYmd).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const [, y, mm, dd] = m;
        return `${dd}/${mm}/${y}`;
      }
      // Tenta formato ISO completo (com 'T')
      const d = new Date(isoOrYmd);
      if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return '—';
    } catch (e) {
      return '—';
    }
  }

  // Helper para verificar se a assistente já foi paga
  // NOTA: OrderItemResponsible não possui a propriedade 'paidAt' na interface atual
  // Esta funcionalidade precisaria ser adicionada ao backend
  isAssistantPaid(item: OrderItem): boolean {
    // Retorna false por enquanto, até o backend adicionar o campo paidAt
    return false;
    // return !!item.responsible?.paidAt; // Quando o campo estiver disponível
  }
}
