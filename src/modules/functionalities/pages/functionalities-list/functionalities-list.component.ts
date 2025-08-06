import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FunctionalitiesService } from '../../services/functionalities.service';
import { FunctionalityDto } from '../../interfaces/functionalities.interface';
import { UsersService } from '../../../users/services/users.service';
import { ResponseUserDto } from '../../../users/types/user.dto';

@Component({
  selector: 'app-functionalities-list',
  templateUrl: './functionalities-list.component.html',
  styleUrls: ['./functionalities-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
})
export class FunctionalitiesListComponent implements OnInit {
  functionalities: FunctionalityDto[] = [];
  responsibleUsers: { [id: string]: string } = {};
  loading = true;

  constructor(
    private functionalitiesService: FunctionalitiesService,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.functionalitiesService.getAll().subscribe({
      next: (data) => {
        this.functionalities = data;
        // Coletar todos os responsibleUserId únicos
        const ids = Array.from(
          new Set(data.map((f) => f.responsibleUserId).filter(Boolean))
        );
        if (ids.length > 0) {
          this.usersService.getUsers().subscribe({
            next: (users: ResponseUserDto[]) => {
              this.responsibleUsers = {};
              users.forEach((u) => {
                if (ids.includes(u.id)) {
                  this.responsibleUsers[u.id] = u.name;
                }
              });
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            },
          });
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
