import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Reminder } from '../../../../models/reminder.model';
import { RemindersApi } from '../../../../services/crud/reminders/reminders-api';
import { Auth } from '../../../../services/auth';
import { catchError, of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { Alert } from '../../../../services/alert';

@Component({
  selector: 'app-reminders-from-task',
  imports: [CommonModule, DatePipe, MatIcon],
  templateUrl: './reminders-from-task.html',
  styleUrl: './reminders-from-task.css',
})
export class RemindersFromTask {

  @Input() taskIdSignal = signal<number | null>(null);
  @Output() reminderDeleted = new EventEmitter<number>();
  @Output() closeDialog = new EventEmitter<void>();

  allReminders = signal<Reminder[]>([]);
  currentUser = computed(() => this.auth.currentUser());

  animationType: 'remove' | null = null;
  animatedReminderId: number | null = null;
  private readonly ANIMATION_TIME = 500;
  
  constructor(private remindersApi: RemindersApi, private auth: Auth, private alertService: Alert){
       effect(() => {
      const user = this.currentUser();

      if (!user?.id) return;
      const task_id = this.taskIdSignal();
      if (!task_id) return;
      this.remindersApi.getReminderByTask(task_id, false).pipe(catchError(() => of([]))).subscribe(reminders => {
        this.allReminders.set(reminders);
      });
    });
  }

  deleteReminder(id: number){
    this.animateCategoryAndExecute(id, 'remove', () => {
      this.remindersApi.deleteReminder(id).subscribe(()=>{
        const filteredReminders = this.allReminders().filter(u => u.id !== id);
        this.allReminders.set(filteredReminders);
        const task_id = this.taskIdSignal();
        if (task_id) {this.reminderDeleted.emit(task_id)};
        this.alertService.sendAlert({
          message: `Promemoria eliminato con successo`,
          classAlert: 'success'
        });
      })
    })
  }

  animateCategoryAndExecute(id: number, type: 'remove', action: () => void) {
    this.animatedReminderId = id;
    this.animationType = type;

    setTimeout(() => {
      action();
      this.animatedReminderId = null;
      this.animationType = null;
    }, this.ANIMATION_TIME);
  }

}
