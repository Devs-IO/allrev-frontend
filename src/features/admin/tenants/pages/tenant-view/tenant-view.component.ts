import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantsService } from '../../services/tenants.service';
import { Tenant } from '../../interfaces/tenant.interface';
import {
  PaymentStatusLabels,
  PaymentMethodLabels,
  PaymentFrequencyLabels,
} from '../../interfaces/tenant.enums';

@Component({
  selector: 'app-tenant-view',
  templateUrl: './tenant-view.component.html',
  styleUrls: ['./tenant-view.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TenantViewComponent implements OnInit {
  tenant: Tenant | null = null;
  loading = true;
  error: string | null = null;

  // Labels para enums
  paymentStatusLabels = PaymentStatusLabels;
  paymentMethodLabels = PaymentMethodLabels;
  paymentFrequencyLabels = PaymentFrequencyLabels;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tenantsService: TenantsService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTenant(id);
    } else {
      this.error = 'ID da empresa não fornecido';
      this.loading = false;
    }
  }

  loadTenant(id: string): void {
    this.tenantsService.getTenant(id).subscribe({
      next: (data: Tenant) => {
        this.tenant = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar empresa:', err);
        this.error = 'Erro ao carregar dados da empresa';
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/tenants']);
  }

  editTenant(): void {
    if (this.tenant) {
      this.router.navigate(['/tenants', this.tenant.id, 'edit']);
    }
  }
}
