import { Component, computed, effect, Input, signal } from '@angular/core';
import { FilterService } from '../../../services/filter-service';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-filter',
  imports: [DatePipe, CommonModule, MatIcon],
  templateUrl: './filter.html',
  styleUrl: './filter.css',
})
export class Filter {

  constructor(public filters: FilterService){}

}
