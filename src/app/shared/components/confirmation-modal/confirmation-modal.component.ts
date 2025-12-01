import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="show"
      class="modal fade show d-block"
      tabindex="-1"
      [style.background]="'rgba(0,0,0,0.5)'"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content rounded-3 shadow-lg">
          <div class="modal-header" [ngClass]="headerClass">
            <h5 class="modal-title">
              <i [class]="iconClass + ' me-2'"></i>
              {{ title }}
            </h5>
            <button
              type="button"
              class="btn-close"
              [class.btn-close-white]="type === 'danger'"
              (click)="onCancel()"
            ></button>
          </div>
          <div class="modal-body text-center py-4">
            <i
              [class]="iconClass + ' fa-3x mb-3'"
              [ngClass]="iconColorClass"
            ></i>
            <h6 class="mb-3">{{ message }}</h6>
            <div
              *ngIf="type === 'danger'"
              class="alert alert-warning"
              role="alert"
            >
              <i class="fas fa-warning me-2"></i>
              <strong>Atenção:</strong> Esta ação não pode ser desfeita!
            </div>
            <div class="text-muted" *ngIf="itemInfo">
              <strong>{{ itemInfo.primary }}</strong
              ><br />
              <small *ngIf="itemInfo.secondary">{{ itemInfo.secondary }}</small>
            </div>
          </div>
          <div class="modal-footer border-0 justify-content-center">
            <button
              type="button"
              class="btn btn-outline-secondary px-4"
              (click)="onCancel()"
            >
              <i class="fas fa-times me-1"></i>
              Cancelar
            </button>
            <button
              type="button"
              [class]="confirmButtonClass + ' px-4'"
              (click)="onConfirm()"
            >
              <i [class]="confirmIconClass + ' me-1'"></i>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal {
        .modal-dialog {
          margin-top: 10vh;
        }

        .modal-content {
          border: none;
          overflow: hidden;
        }

        .modal-header {
          border-bottom: none;
          padding: 1.5rem;

          .modal-title {
            font-weight: 600;
            font-size: 1.25rem;
          }
        }

        .modal-body {
          padding: 2rem 1.5rem;

          .fa-3x {
            font-size: 3rem !important;
            margin-bottom: 1.5rem;
          }

          h6 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #333;
          }

          .alert {
            margin: 1rem 0;
            border: none;
            border-radius: 8px;
          }
        }

        .modal-footer {
          padding: 1rem 1.5rem 1.5rem;
          gap: 1rem;

          .btn {
            min-width: 120px;
            font-weight: 500;
            border-radius: 8px;
            padding: 0.75rem 1.5rem;
            transition: all 0.2s ease;

            &:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }
          }
        }
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    `,
  ],
})
export class ConfirmationModalComponent {
  @Input() show = false;
  @Input() type: 'edit' | 'danger' = 'danger';
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = 'Confirmar';
  @Input() itemInfo: { primary?: string; secondary?: string } | null = null;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  get headerClass(): string {
    return this.type === 'edit'
      ? 'bg-warning text-dark'
      : 'bg-danger text-white';
  }

  get iconClass(): string {
    return this.type === 'edit' ? 'fas fa-edit' : 'fas fa-trash';
  }

  get iconColorClass(): string {
    return this.type === 'edit' ? 'text-warning' : 'text-danger';
  }

  get confirmButtonClass(): string {
    return this.type === 'edit' ? 'btn btn-warning' : 'btn btn-danger';
  }

  get confirmIconClass(): string {
    return this.type === 'edit' ? 'fas fa-edit' : 'fas fa-trash';
  }

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
