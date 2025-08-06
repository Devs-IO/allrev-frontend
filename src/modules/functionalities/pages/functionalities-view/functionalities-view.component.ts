import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';

@Component({
  selector: 'app-functionalities-view',
  templateUrl: './functionalities-view.component.html',
  styleUrls: ['./functionalities-view.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class FunctionalitiesViewComponent implements OnInit {
  functionality: FunctionalityDto | null = null;
  loading = true;

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.functionalitiesService.getAll().subscribe({
        next: (data) => {
          this.functionality = data.find((f) => f.id === id) || null;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
    } else {
      this.loading = false;
    }
  }
}
