import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-paginator',
  imports: [CommonModule, MatIcon],
  templateUrl: './paginator.html',
  styleUrl: './paginator.css',
})
export class Paginator {

  currentPage = input.required<number>();
  totalItems = input.required<number>();
  pageSize = input.required<number>();

  pageChange = output<number>();

  totalPages = computed(() =>
    Math.ceil(this.totalItems() / this.pageSize())
  );

  next() {
    if (this.currentPage() < this.totalPages()) {
      this.pageChange.emit(this.currentPage() + 1);
      this.scrollToTop();
    }
  }

  prev() {
    if (this.currentPage() > 1) {
      this.pageChange.emit(this.currentPage() - 1);
      this.scrollToTop();  
    }
  }

  onManualInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = Number(input.value);

    if (isNaN(value)) {
      input.value = String(this.currentPage());
      return;
    }

    const max = this.totalPages();

    if (value < 1) value = 1;
    if (value > max) value = max;

    if (value === this.currentPage()) return;
  
    input.blur();
    this.pageChange.emit(value);
    this.scrollToTop();
  }

  private scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // animazione fluida
    });
  }

}