import { Component, OnInit } from '@angular/core';
import {
  ServicesService,
  ServiceDefinitionDto,
} from '../../services/services.service';

@Component({
  selector: 'app-services-list',
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss'],
})
export class ServicesListComponent implements OnInit {
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
