import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';

@Component({
  selector: 'app-functionalities-edit',
  templateUrl: './functionalities-edit.component.html',
  styleUrls: ['./functionalities-edit.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class FunctionalitiesEditComponent implements OnInit {
  form = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100)],
    ],
    description: [''],
    minimumPrice: [null, [Validators.required, Validators.min(0.01)]],
    defaultAssistantPrice: [null],
    status: ['ACTIVE' as 'ACTIVE' | 'INACTIVE'],
  });
  loading = true;
  error = '';
  functionalityId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private functionalitiesService: FunctionalitiesService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.functionalityId = id;
    if (!id) {
      this.loading = false;
      return;
    }
    // Load list and pick the item (backend lacks a getById route)
    this.functionalitiesService.getAll().subscribe({
      next: (items) => {
        const item = items.find((f) => f.id === id);
        if (item) {
          this.form.patchValue({
            name: item.name,
            description: item.description || '',
            minimumPrice: item.minimumPrice as any,
            defaultAssistantPrice: (item.defaultAssistantPrice ?? null) as any,
            status: item.status,
          });
          this.form.markAsPristine();
        } else {
          this.error = 'Funcionalidade não encontrada';
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Erro ao carregar funcionalidade';
        this.loading = false;
      },
    });
  }

  submit() {
    if (this.form.invalid || !this.form.dirty) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.value as any;
    const payload: Partial<FunctionalityDto> = {
      name: raw.name || '',
      description: raw.description || undefined,
      status: raw.status as 'ACTIVE' | 'INACTIVE',
    };

    // minimumPrice must be a valid number > 0
    if (
      raw.minimumPrice !== null &&
      raw.minimumPrice !== undefined &&
      raw.minimumPrice !== ''
    ) {
      const parsedMin = parseFloat(String(raw.minimumPrice));
      if (!isNaN(parsedMin) && parsedMin > 0) {
        (payload as any).minimumPrice = parsedMin;
      } else {
        this.error = 'Preço mínimo inválido';
        return;
      }
    }

    // defaultAssistantPrice optional; if present, coerce to number
    if (
      raw.defaultAssistantPrice !== null &&
      raw.defaultAssistantPrice !== undefined &&
      raw.defaultAssistantPrice !== ''
    ) {
      const parsedAssist = parseFloat(String(raw.defaultAssistantPrice));
      if (!isNaN(parsedAssist) && parsedAssist >= 0) {
        (payload as any).defaultAssistantPrice = parsedAssist;
      } else {
        this.error = 'Preço do assistente inválido';
        return;
      }
    }
    this.functionalitiesService
      .update(this.functionalityId, payload)
      .subscribe({
        next: () => {
          alert('Funcionalidade atualizada com sucesso');
          this.router.navigate(['/functionalities']);
        },
        error: () => {
          this.error = 'Erro ao atualizar funcionalidade';
        },
      });
  }

  confirmDelete(id: string) {
    const ok = window.confirm(
      'Tem certeza que deseja desativar esta funcionalidade?'
    );
    if (!ok) return;
    this.functionalitiesService.softDelete(id).subscribe({
      next: () => {
        alert('Funcionalidade desativada com sucesso');
        this.router.navigate(['/functionalities']);
      },
      error: () => {
        this.error = 'Erro ao desativar funcionalidade';
      },
    });
  }
}
