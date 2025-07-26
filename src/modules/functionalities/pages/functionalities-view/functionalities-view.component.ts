import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {
  FunctionalitiesService,
  ServiceDefinitionDto,
} from '../../services/functionalities.service';

@Component({
  selector: 'app-functionalities-view',
  templateUrl: './functionalities-view.component.html',
  styleUrls: ['./functionalities-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class FunctionalitiesViewComponent implements OnInit {
  functionalities: ServiceDefinitionDto[] = [];
  loading = true;

  constructor(private functionalitiesService: FunctionalitiesService) {}

  ngOnInit() {
    this.functionalitiesService.getAll().subscribe({
      next: (data) => {
        this.functionalities = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
