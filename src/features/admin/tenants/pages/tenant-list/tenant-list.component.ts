import { Component, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TenantsService } from '../../services/tenants.service';
import { Tenant } from '../../interfaces/tenant.interface';
import {
  PaymentStatus,
  PaymentStatusLabels,
  PaymentMethodLabels,
  PaymentFrequencyLabels,
} from '../../interfaces/tenant.enums';

@Component({
  selector: 'app-tenant-list',
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class TenantListComponent implements OnInit {
  tenants: WritableSignal<Tenant[]> = signal<Tenant[]>([]);
  loading = true;
  error: string | null = null;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Estado para modais de confirmação
  showEditModal = false;
  showDeleteModal = false;
  selectedTenant: Tenant | null = null;

  // Labels para enums
  paymentStatusLabels = PaymentStatusLabels;
  paymentMethodLabels = PaymentMethodLabels;
  paymentFrequencyLabels = PaymentFrequencyLabels;
  PaymentStatus = PaymentStatus;
  constructor(private tenantsService: TenantsService, private router: Router) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.tenantsService.getTenants().subscribe({
      next: (data: Tenant[]) => {
        this.tenants.set(data);
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
        this.error = 'Erro ao carregar empresas';
        this.loading = false;
      },
    });
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    const sorted = [...this.tenants()].sort((a, b) => {
      const key = column as keyof Tenant;
      let aValue = a[key];
      let bValue = b[key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.tenants.set(sorted);
  }

  viewTenant(id: string): void {
    this.router.navigate(['/tenants', id]);
  }

  editTenant(id: string): void {
    this.selectedTenant = this.tenants().find((t) => t.id === id) || null;
    this.showEditModal = true;
  }

  confirmEdit(): void {
    if (this.selectedTenant) {
      this.showEditModal = false;
      this.router.navigate(['/tenants', this.selectedTenant.id, 'edit']);
    }
  }

  closeModals(): void {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.selectedTenant = null;
  }
}
