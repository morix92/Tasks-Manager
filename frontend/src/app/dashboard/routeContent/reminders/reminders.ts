import { Component, computed, Input, signal } from '@angular/core';
import { Reminder } from '../../../models/reminder.model';
import { RemindersApi } from '../../../services/crud/reminders/reminders-api';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { EditReminder } from './edit-reminder/edit-reminder';
import { Auth } from '../../../services/auth';

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

  animationType: 'remove' | null = null;
  animatedReminderId: number | null = null;
  private readonly ANIMATION_TIME = 500;

  constructor(private remindersApi: RemindersApi, private auth: Auth){}

  currentUser = computed(() => this.auth.currentUser());

  ngOnInit(){
    const user = this.currentUser();
    if (user?.id) {
      this.remindersApi.getRemindersByUserId(user.id, 0).subscribe((data: Reminder[]) => {
        this.allReminders.set(data);
      })
    }
  }

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
        console.log("Categoria eliminata")  
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
