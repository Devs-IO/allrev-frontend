import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomersService } from '../../services/customers.service';
import { Client } from '../../interfaces/client.interface';

@Component({
  selector: 'app-customer-view',
  templateUrl: './customer-view.component.html',
  styleUrls: ['./customer-view.component.scss'],
  standalone: true,
  imports: [CommonModule, DatePipe],
})
export class CustomerViewComponent implements OnInit {
  customer: Client | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private customersService: CustomersService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.customersService.getCustomerById(id).subscribe({
        next: (customer) => {
          this.customer = customer;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Erro ao carregar cliente';
          this.loading = false;
        },
      });
    }
  }

  back() {
    this.router.navigate(['/customers']);
  }
}
