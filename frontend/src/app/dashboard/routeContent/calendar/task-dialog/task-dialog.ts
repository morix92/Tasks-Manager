import { Component, computed, effect, input, signal } from '@angular/core';
import { Task } from '../../../../models/task.model';
import { CommonModule } from '@angular/common';
import { RemindersApi } from '../../../../services/crud/reminders/reminders-api';
import { catchError, of } from 'rxjs';
import { Reminder } from '../../../../models/reminder.model';
import { MatIcon } from '@angular/material/icon';
import { AddReminder } from '../../reminders/add-reminder/add-reminder';
import { socketService } from '../../../../services/socket';

const PRIORITY_MAP: Record<number, string> =  { 1: 'Alta', 2: 'Media', 3: 'Bassa'};
const STATUS_MAP: Record<number, string> =  { 0: 'Da Fare', 1: 'Completata', 2: 'Scaduta'};

@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule, MatIcon, AddReminder],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.css',
})
export class TaskDialog {

  task = input.required<Task | null>();
  activeDialog = signal<boolean>(false);
  selectedTaskId = signal<number | null>(null);
  notified = computed(() => this.socketService.notified());
  
  taskView = computed(() => {
    const task = this.task();
    if (!task) return null;

    return {
      ...task,
      priorityLabel: PRIORITY_MAP[task.priority] ?? 'N/A',
      statusLabel: STATUS_MAP[task.status] ?? 'N/A'
    };
  });
  taskId = computed (() => {this.taskView()?.id})

  allReminders = signal<Reminder[]>([]);
    
  constructor(private remindersApi: RemindersApi, private socketService: socketService){
    effect(() => {
      const task_id = this.taskView()?.id;
      const _trigger = this.socketService.notified();
      if (!task_id) return;
      this.remindersApi.getReminderByTask(task_id, 0).pipe(catchError(() => of([]))).subscribe(reminders => {
        this.allReminders.set(reminders);
      });
    });

  }

  addReminder(id: number){
    this.selectedTaskId.set(id);
    this.activeDialog.set(true)
  }

  deleteReminder(id : number){
    this.remindersApi.deleteReminder(id).subscribe(() => {
      const filteredReminders = this.allReminders().filter(u => u.id !== id);
      this.allReminders.set(filteredReminders);
    })
  }

  onReminderCreated(reminder: Reminder) {
    this.allReminders.set([...this.allReminders(), reminder]);
  }

  closeDialog(){
    this.activeDialog.set(false);
  }


}
