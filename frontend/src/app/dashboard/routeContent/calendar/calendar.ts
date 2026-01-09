import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';

interface Task {
  date: Date;
  title: string;
}

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule],
  providers: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnInit {
  @Input() tasks: Task[] = [];
  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth();

  monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  weekDays = ['L','M','M','G','V','S','D'];

  weeks: CalendarDay[][] = [];

  ngOnInit() {
    this.generateCalendar();
  }

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // lun=0
    const totalDays = lastDay.getDate();

    let days: CalendarDay[] = [];

    // giorni “vuoti” prima del 1 del mese
    for (let i = 0; i < startDay; i++) {
      days.push({ date: new Date(this.currentYear, this.currentMonth, 1 - startDay + i), inMonth: false, tasks: [] });
    }

    // giorni del mese
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const dayTasks = this.tasks.filter(t => this.isSameDate(t.date, date));
      days.push({ date, inMonth: true, tasks: dayTasks });
    }

    // giorni “vuoti” dopo la fine del mese
    while (days.length % 7 !== 0) {
      const nextDate = new Date(this.currentYear, this.currentMonth, totalDays + (days.length % 7));
      days.push({ date: nextDate, inMonth: false, tasks: [] });
    }

    // suddividere in settimane
    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }
    console.log(this.weekDays + " a " + this.weeks)
  }

  isSameDate(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else this.currentMonth--;
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else this.currentMonth++;
    this.generateCalendar();
  }
}
