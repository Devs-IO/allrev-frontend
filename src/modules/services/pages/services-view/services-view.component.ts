import { Component, OnInit } from '@angular/core';
import {
  ServicesService,
  ServiceDefinitionDto,
} from '../../services/services.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class ServicesViewComponent implements OnInit {
  services: ServiceDefinitionDto[] = [];
  loading = true;

  constructor(private servicesService: ServicesService) {}

  ngOnInit() {
    this.servicesService.getAll().subscribe({
      next: (data) => {
        this.services = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
