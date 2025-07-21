import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TenantsService } from '../../services/tenants.service';

@Component({
  selector: 'app-tenant-list',
  templateUrl: './tenant-list.component.html',
  styleUrls: ['./tenant-list.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class TenantListComponent implements OnInit {
  tenants: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private tenantsService: TenantsService) {}

  ngOnInit(): void {
    this.tenantsService.getTenants().subscribe({
      next: (tenants) => {
        this.tenants = tenants;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar empresas';
        this.loading = false;
      },
    });
  }
}
