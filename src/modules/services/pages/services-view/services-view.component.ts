import { Component, OnInit } from '@angular/core';
import {
  ServicesService,
  ServiceDefinitionDto,
} from '../../services/services.service';

@Component({
  selector: 'app-services-view',
  templateUrl: './services-view.component.html',
  styleUrls: ['./services-view.component.scss'],
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
