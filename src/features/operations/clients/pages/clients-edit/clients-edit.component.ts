import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../interfaces/client.interface';
import { PhoneMaskDirective } from '../../../../../app/shared/directives/phone-mask.directive';

@Component({
  selector: 'app-clients-edit',
  templateUrl: './clients-edit.component.html',
  styleUrls: ['./clients-edit.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PhoneMaskDirective,
  ],
})
export class ClientsEditComponent implements OnInit {
  clients: Client | null = null;
  // Holds only the editable fields to avoid sending immutable fields to the API
  formData: Partial<
    Pick<
      Client,
      | 'name'
      | 'email'
      | 'phone'
      | 'note'
      | 'course'
      | 'observation'
      | 'university'
      | 'isActive'
    >
  > = {};
  // Snapshot of original editable values for dirty checking
  private originalEditable: Partial<
    Pick<
      Client,
      | 'name'
      | 'email'
      | 'phone'
      | 'note'
      | 'course'
      | 'observation'
      | 'university'
      | 'isActive'
    >
  > | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private clientsService: ClientsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.clientsService.getClientsById(id).subscribe({
        next: (clients) => {
          this.clients = clients;
          // Keep only the editable fields in the form model
          this.formData = this.pickEditableFields(clients);
          this.originalEditable = this.pickEditableFields(clients);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar cliente';
          this.loading = false;
        },
      });
    }
  }

  submit() {
    if (this.clients) {
      // Do not submit if nothing changed
      if (!this.isDirty()) {
        return;
      }
      // Build a sanitized payload with only permitted fields
      const payload = this.pickEditableFields(this.formData);
      this.clientsService.updateClients(this.clients.id, payload).subscribe({
        next: () => this.router.navigate(['/clients']),
        error: (err) => (this.error = 'Erro ao atualizar cliente'),
      });
    }
  }

  // Utility: pick only allowed fields for update
  private pickEditableFields(source: any) {
    return {
      name: source?.name,
      email: source?.email,
      phone: source?.phone,
      note: source?.note,
      course: source?.course,
      observation: source?.observation,
      university: source?.university,
      isActive: source?.isActive,
    } as Partial<
      Pick<
        Client,
        | 'name'
        | 'email'
        | 'phone'
        | 'note'
        | 'course'
        | 'observation'
        | 'university'
        | 'isActive'
      >
    >;
  }

  // Compare current form values with original snapshot
  isDirty(): boolean {
    if (!this.originalEditable) return false;
    const a = this.normalizeForCompare(this.originalEditable);
    const b = this.normalizeForCompare(this.formData);
    return !this.shallowEqual(a, b);
  }

  private normalizeForCompare(
    obj: Partial<
      Pick<
        Client,
        | 'name'
        | 'email'
        | 'phone'
        | 'note'
        | 'course'
        | 'observation'
        | 'university'
        | 'isActive'
      >
    >
  ) {
    return {
      name: (obj.name ?? '').toString().trim(),
      email: (obj.email ?? '').toString().trim(),
      phone: (obj.phone ?? '').toString().trim(),
      note: (obj.note ?? '').toString().trim(),
      course: (obj.course ?? '').toString().trim(),
      observation: (obj.observation ?? '').toString().trim(),
      university: (obj.university ?? '').toString().trim(),
      isActive: String(obj.isActive ?? ''),
    };
  }

  private shallowEqual(a: any, b: any): boolean {
    const keys = Object.keys(a);
    for (const k of keys) {
      if (a[k] !== b[k]) return false;
    }
    return true;
  }
}
