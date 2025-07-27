import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';

@Component({
  selector: 'app-functionalities-list',
  templateUrl: './functionalities-list.component.html',
  styleUrls: ['./functionalities-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class FunctionalitiesListComponent implements OnInit {
  functionalities: FunctionalityDto[] = [];
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
