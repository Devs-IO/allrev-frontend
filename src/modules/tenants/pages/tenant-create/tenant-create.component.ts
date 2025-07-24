import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantsService } from '../../services/tenants.service';
@Component({
  selector: 'app-tenant-create',
  templateUrl: './tenant-create.component.html',
  styleUrls: ['./tenant-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TenantCreateComponent {
  formData: any = {};
  error: string | null = null;

  constructor(private tenantsService: TenantsService, private router: Router) {}

  submit() {
    this.tenantsService.createTenant(this.formData).subscribe({
      next: () => this.router.navigate(['/tenants']),
      error: () => (this.error = 'Erro ao criar empresa'),
    });
  }
}
