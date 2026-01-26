import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Reminder } from '../../../../models/reminder.model';
import { RemindersApi } from '../../../../services/crud/reminders/reminders-api';
import { UpdateReminderDto } from '../../../../models/updateReminder.model';
import { Alert } from '../../../../services/alert';

@Component({
  selector: 'app-edit-reminder',
  imports: [],
  templateUrl: './edit-reminder.html',
  styleUrl: './edit-reminder.css',
})
export class EditReminder {

  @Input({ required: true }) reminder!: Reminder | null;
  @Output() reminderUpdated = new EventEmitter<Reminder>();
  @Output() closeDialog = new EventEmitter<void>();

  datePart = signal<string>('');
  timePart = signal<string>('');
  isSubmitted = signal(false);
  
  constructor(private reminderApi: RemindersApi, private alertService: Alert){
    effect(() => {
      if (!this.reminder) return;

      const date = new Date(this.reminder.remind_at);

      this.datePart.set(
        date.toLocaleDateString('en-CA')
      );

      this.timePart.set(
        date.toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      );

      this.formModel.set({
        remind_at: date
      });
    });
  }

  formModel = signal<UpdateReminderDto>({
    remind_at: new Date()
  });

  remindAtComputed = computed<Date>(() => {
    const date = this.datePart();
    const time = this.timePart();

    if (!date || !time) {
      return this.formModel().remind_at;
    }

    return new Date(`${date}T${time}`);
  });

  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    if (!f.remind_at) {
      errors['remind_at'] = 'Il campo è obbligatorio';
    }
  return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  updateRemindAt(value: string) {
    this.formModel.set({ ...this.formModel(), remind_at: new Date(value) });
  }

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.updateReminder({remind_at: this.remindAtComputed()});
  }

  updateReminder(body: UpdateReminderDto) {
    if (!this.reminder) return;
    
    this.reminderApi.updateReminder(this.reminder.id, body).subscribe({
      next: (reminder: Reminder) => {
        this.reminderUpdated.emit(reminder);
        this.closeDialog.emit();
        this.alertService.sendAlert({
          message: `Promemoria del task ${reminder.task_title} modificato con successo`,
          classAlert: 'success'
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

}
