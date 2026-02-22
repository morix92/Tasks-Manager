import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, Input, OnInit, signal } from '@angular/core';
import { TasksApi } from '../../../services/crud/tasks/tasks-api';
import { Auth } from '../../../services/auth';
import { catchError, of } from 'rxjs';
import { Task } from '../../../models/task.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { TaskDialog } from './task-dialog/task-dialog';
import { MatIcon } from '@angular/material/icon';
import { socketService } from '../../../services/socket';
import { DataDialog } from './data-dialog/data-dialog';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  tasks: Task[];
  weekDayLabel: string;
  isToday: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [CommonModule, MatSlideToggleModule, FormsModule, MatChipsModule, TaskDialog, MatIcon, DataDialog],
  providers: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {

  isChecked = signal<boolean>(false);
  viewMode = signal<'month' | 'tenDays'>('month');
  
  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth());
  today = computed(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d;
  });
  notified = computed(() => this.socketService.notified());

  monthNames = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  weekDays = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];

  weeks = signal<CalendarDay[][]>([]);

  currentUser = computed(() => this.auth.currentUser());
  allTasks = signal<Task[]>([]);
  selectedTask = signal<Task | null>(null);
  activeDialog = signal<boolean>(false);
  activeDateDialog = signal<boolean>(false);

  isAnimating = false;

  calendarTitle = computed(() => {
    if (this.viewMode() === 'month') {
      return `${this.monthNames[this.currentMonth()]} ${this.currentYear()}`;
    }

    const days = this.weeks().flat();
    if (!days.length) return '';

    const first = days[0].date;
    const last = days[days.length - 1].date;

    const sameMonth =
      first.getMonth() === last.getMonth() &&
      first.getFullYear() === last.getFullYear();

    if (sameMonth) {
      return `${this.monthNames[first.getMonth()]} ${first.getFullYear()}`;
    }

    if (first.getFullYear() === last.getFullYear()) {
      return `${this.monthNames[first.getMonth()]} / ${this.monthNames[last.getMonth()]} ${first.getFullYear()}`;
    }

    return `${this.monthNames[first.getMonth()]} ${first.getFullYear()} / ${this.monthNames[last.getMonth()]} ${last.getFullYear()}`;
  });

  private animateAndRun(action: () => void) {
    this.isAnimating = true;

    setTimeout(() => {
      action();
      this.isAnimating = false;
    }, 200);
  }
  
  constructor(private auth: Auth, private tasksApi: TasksApi, private socketService: socketService){
    this.generateCalendar();

    effect(() => {
      const _trigger = this.socketService.notified();
      const user = this.currentUser();
      if (!user?.id) return;

      this.tasksApi.getTasksByUserId(user.id).pipe(catchError(() => of([]))).subscribe(tasks => {
        if (tasks){
          this.allTasks.set(tasks);
          this.assignTasksToDays();
        }
      });
    });
  }

  generateCalendar() {
    const days: CalendarDay[] = [];

    if (this.viewMode() === 'month') {
      const firstDay = new Date(this.currentYear(), this.currentMonth(), 1);
      const lastDay = new Date(this.currentYear(), this.currentMonth() + 1, 0);

      const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
      const totalDays = lastDay.getDate();

      // giorni vuoti prima del mese
      for (let i = 0; i < startDay; i++) {
        const prevDate = new Date(this.currentYear(), this.currentMonth(), 1 - startDay + i);
        days.push({ date: new Date(prevDate), inMonth: false, tasks: [], weekDayLabel: this.getWeekDayLabel(prevDate), isToday: this.isSameDate(prevDate, this.today()) });
      }

      // giorni del mese
      for (let i = 1; i <= totalDays; i++) {
        const date = new Date(this.currentYear(), this.currentMonth(), i);
        days.push({ date, inMonth: true, tasks: [], weekDayLabel: this.getWeekDayLabel(date), isToday: this.isSameDate(date, this.today()) });
      }

      let extraDay = 1;
      // giorni vuoti dopo il mese
      while (days.length % 7 !== 0) {
        const nextDate = new Date(this.currentYear(), this.currentMonth() +1 , extraDay);
        days.push({ date: nextDate, inMonth: false, tasks: [], weekDayLabel: this.getWeekDayLabel(nextDate), isToday: this.isSameDate(nextDate, this.today()) });
        extraDay ++;
      }

      // settimane da 7 giorni
      const weeksArray: CalendarDay[][] = [];
      for (let i = 0; i < days.length; i += 7) {
        weeksArray.push(days.slice(i, i + 7));
      }
      this.weeks.set(weeksArray);

    } else if (this.viewMode() === 'tenDays') {
      // view i prossimi 10 giorni
      const today = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        days.push({
          date,
          inMonth: true,
          tasks: [],
          weekDayLabel: this.getWeekDayLabel(date),
          isToday: this.isSameDate(date, this.today())
        });
      }

      // dividi in due righe da 5
      const weeksArray: CalendarDay[][] = [];
      weeksArray.push(days.slice(0, 5));
      weeksArray.push(days.slice(5, 10));
      this.weeks.set(weeksArray);
    }

    // assegna i task se già presenti
    this.assignTasksToDays();
  }

  assignTasksToDays() {
    const tasks = this.allTasks();
    const todayDate = this.today();

    if (!tasks.length) return;

    this.weeks.update(weeks => 
      weeks.map(week => 
        week.map(day => ({
          ...day,
          tasks: tasks.filter(t => this.isSameDate(t.due_date, day.date)),
          isToday: day.date.getTime() === todayDate.getTime()
        }))
      )
    );
  }

  isSameDate(d1: Date, d2: Date): boolean {
    const date1 = new Date(d1);
    const date2 = new Date(d2);

    date1.setHours(0, 0, 0, 0);
    date2.setHours(0, 0, 0, 0);

    return date1.getTime() === date2.getTime();
  }

  prevMonth() {
    this.animateAndRun(() => {
      if (this.currentMonth() === 0) {
        this.currentMonth.set(11);
        this.currentYear.update(y => y - 1);
      } else {
        this.currentMonth.update(m => m - 1);
      }
      this.generateCalendar();
    });
  }

  nextMonth() {
    this.animateAndRun(() => {
      if (this.currentMonth() === 11) {
        this.currentMonth.set(0);
        this.currentYear.update(y => y + 1);
      } else {
        this.currentMonth.update(m => m + 1);
      }
      this.generateCalendar();
    });
  }


  onToggle(event: any) {
    this.animateAndRun(() => {
      const target = event.target as HTMLInputElement;
      this.isChecked.set(target.checked);
      this.viewMode.set(this.viewMode() === 'month' ? 'tenDays' : 'month');
      this.generateCalendar();
    });
  }
  
  private getWeekDayLabel(date: Date): string {
    const jsDay = date.getDay();
    const mondayBasedIndex = jsDay === 0 ? 6 : jsDay - 1;
    return this.weekDays[mondayBasedIndex];
  }

  openTask(task: Task){
    this.selectedTask.set(task);
    this.activeDialog.set(true);
  }

  closeDialog(){
    this.activeDialog.set(false);
    this.activeDateDialog.set(false);
  }

  changeDate() {
    this.activeDateDialog.set(true);
  }

  setNewDate(event: { month: number; year: number }) {
    this.animateAndRun(() => {
      this.currentMonth.set(event.month);
      this.currentYear.set(event.year);
      this.generateCalendar();
    });

    this.closeDialog();
  }

  goToToday() {
    const now = new Date();

    this.animateAndRun(() => {
      this.currentMonth.set(now.getMonth());
      this.currentYear.set(now.getFullYear());
      this.generateCalendar();
    });

    this.closeDialog();
  }

}