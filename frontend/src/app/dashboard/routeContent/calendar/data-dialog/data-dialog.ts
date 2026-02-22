import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-data-dialog',
  imports: [CommonModule, FormsModule],
  templateUrl: './data-dialog.html',
  styleUrl: './data-dialog.css',
})
export class DataDialog {

  @Input() set month(value: number) {
    this.selectedMonthValue = value;
  }

  @Input() set year(value: number) {
    this.selectedYearValue = value;
  }

  @Output() confirm = new EventEmitter<{ month: number; year: number }>();
  @Output() goToday = new EventEmitter<void>();

  selectedMonthValue!: number;
  selectedYearValue!: number;
  private baseYear = new Date().getFullYear();

  monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

  years = Array.from({ length: 28 }, (_, i) => this.baseYear - 3 + i);

  onConfirm() {
    this.confirm.emit({
      month: this.selectedMonthValue,
      year: this.selectedYearValue
    });
  }

  goToToday() {
    this.goToday.emit();
  }
}
