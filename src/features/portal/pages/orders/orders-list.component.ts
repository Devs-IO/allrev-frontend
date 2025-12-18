import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-portal-orders-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-list.component.html',
  styleUrls: ['./orders-list.component.scss'],
})
export class PortalOrdersListComponent implements OnInit {
  private http = inject(HttpClient);
  loading = false;
  error: string | null = null;

  page = 1;
  pageSize = 10;
  total = 0;
  orders: any[] = [];

  ngOnInit(): void {
    this.fetch();
  }

  fetch(page = this.page) {
    this.loading = true;
    this.error = null;

    this.http
      .get<any>(`${environment.apiUrl}/orders/portal/my`, {
        params: { page, pageSize: this.pageSize },
      })
      .subscribe({
        next: (res) => {
          this.orders = res.data || [];
          this.total = res.total || 0;
          this.page = res.page || page;
          this.pageSize = res.limit || this.pageSize;
          this.loading = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erro ao carregar ordens';
          this.loading = false;
        },
      });
  }

  nextPage() {
    if (this.page * this.pageSize < this.total) {
      this.fetch(this.page + 1);
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.fetch(this.page - 1);
    }
  }
}
