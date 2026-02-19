import { Component, computed, effect, Input, signal } from '@angular/core';
import { Reminder } from '../../../models/reminder.model';
import { RemindersApi } from '../../../services/crud/reminders/reminders-api';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { EditReminder } from './edit-reminder/edit-reminder';
import { Auth } from '../../../services/auth';
import { FilterService } from '../../../services/filter-service';
import { Alert } from '../../../services/alert';
import { socketService } from '../../../services/socket';

@Component({
  selector: 'app-reminders',
  imports: [MatIconModule, CommonModule, EditReminder],
  templateUrl: './reminders.html',
  styleUrl: './reminders.css',
})
export class Reminders {

  @Input() taskIdSignal = signal<number>(0);

  allReminders = signal<Reminder[]>([]);
  selectedReminder = signal<Reminder | null>(null);
  showDialogEditReminder = signal<boolean>(false);
  notified = computed(() => this.socketService.notified());

  animationType: 'remove' | null = null;
  animatedReminderId: number | null = null;
  private readonly ANIMATION_TIME = 500;

  constructor(private remindersApi: RemindersApi, private auth: Auth, private filters: FilterService, private alertService: Alert, private socketService: socketService){
    this.filters.setShowOrdering(false);
    effect(() => {
      const _trigger = this.socketService.notified();
      const user = this.currentUser();
      if (user?.id) {
        this.remindersApi.getRemindersByUserId(user.id, 0).subscribe((data: Reminder[]) => {
          this.allReminders.set(data);
        })
      }
    }) 
  }

  currentUser = computed(() => this.auth.currentUser());
  
  filteredReminders = computed(() => {
    const reminders = this.allReminders();
    const title = this.filters.title().toLowerCase();
    const dueDate = this.filters.dueDate();
    const remindAt = this.filters.remindAt();

    return reminders.filter(reminders => {

      const matchesTitle =
        !title || reminders.task_title?.toLowerCase().includes(title);

      const matchesDueDate =
        !dueDate || this.isSameDate(reminders.task_due_date, dueDate);

      const matchesRemindAt =
        !remindAt || this.isSameDate(reminders.remind_at, remindAt);

      return matchesTitle && matchesRemindAt && matchesDueDate;
    });
  });
  
  private isSameDate(d1: Date | string, d2: Date): boolean {
    const date1 = new Date(d1);
    const date2 = new Date(d2);

    date1.setHours(0,0,0,0);
    date2.setHours(0,0,0,0);

    return date1.getTime() === date2.getTime();
  }

  sortedReminders = computed(() => {
    const reminders = [...this.filteredReminders()];

    const orderBy = this.filters.orderBy();
    const direction = this.filters.orderDirection();

    if (!orderBy) return reminders;

    return reminders.sort((a, b) => {
      let compare = 0;

      if (orderBy === 'remindAt') {
        compare =
          new Date(a.remind_at).getTime() -
          new Date(b.remind_at).getTime();
      }

      if (orderBy === 'dueDate') {
        compare =
          new Date(a.task_due_date).getTime() -
          new Date(b.task_due_date).getTime();
      }

      return direction === 'asc' ? compare : -compare;
    });
  });

  editReminder(id: number) {
    this.remindersApi.getReminderById(id).subscribe((data: Reminder) => {
      this.selectedReminder.set(data);
      this.showDialogEditReminder.set(true);
    });
  }

  onReminderUpdated(reminder: Reminder) {
    const updatedReminders = this.allReminders().map(r => r.id === reminder.id ? reminder : r);
    this.allReminders.set(updatedReminders);
    this.showDialogEditReminder.set(false);
  }

  closeDialog(event: Event){
    this.showDialogEditReminder.set(false);
  }

  deleteReminder(id: number) {
    this.animateCategoryAndExecute(id, 'remove', () => {
      this.remindersApi.deleteReminder(id).subscribe(()=>{
        const filteredCategories = this.allReminders().filter(u => u.id !== id);
        this.allReminders.set(filteredCategories);
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
