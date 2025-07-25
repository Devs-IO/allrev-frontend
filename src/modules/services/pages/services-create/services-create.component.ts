import { Component } from '@angular/core';
import { FormBuilder, FormsModule, Validators } from '@angular/forms';
import { ServicesService } from '../../services/services.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services-create',
  templateUrl: './services-create.component.html',
  styleUrls: ['./services-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ServicesCreateComponent {
  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    minimumPrice: [0, [Validators.required, Validators.min(0.01)]],
    defaultAssistantPrice: [null],
    status: ['ACTIVE', Validators.required],
    responsibleUserId: ['', Validators.required],
  });

  loading = false;

  constructor(
    private fb: FormBuilder,
    private servicesService: ServicesService,
    private router: Router
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const statusValue =
      this.form.value.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const value = {
      ...this.form.value,
      name: this.form.value.name || '',
      minimumPrice: this.form.value.minimumPrice || 0,
      status: statusValue as 'ACTIVE' | 'INACTIVE',
      responsibleUserId: this.form.value.responsibleUserId || '',
      description: this.form.value.description || undefined,
      defaultAssistantPrice: this.form.value.defaultAssistantPrice ?? undefined,
    };
    this.servicesService.create(value).subscribe({
      next: () => this.router.navigate(['/services']),
      complete: () => (this.loading = false),
    });
  }
}
