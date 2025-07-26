import { Component } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { FunctionalitiesService } from '../../services/functionalities.service';

@Component({
  selector: 'app-functionalities-create',
  templateUrl: './functionalities-create.component.html',
  styleUrls: ['./functionalities-create.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class FunctionalitiesCreateComponent {
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
    private functionalitiesService: FunctionalitiesService,
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
    this.functionalitiesService.create(value).subscribe({
      next: () => this.router.navigate(['/functionalities']),
      complete: () => (this.loading = false),
    });
  }
}
