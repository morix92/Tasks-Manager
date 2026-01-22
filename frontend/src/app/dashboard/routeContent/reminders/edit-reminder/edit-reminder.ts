import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Reminder } from '../../../../models/reminder.model';
import { RemindersApi } from '../../../../services/crud/reminders/reminders-api';
import { UpdateReminderDto } from '../../../../models/updateReminder.model';

@Component({
  selector: 'app-edit-reminder',
  imports: [],
  templateUrl: './edit-reminder.html',
  styleUrl: './edit-reminder.css',
})
export class EditReminder {

  @Input() reminderSignal = signal<Reminder | null>(null);
  @Output() reminderUpdated = new EventEmitter<Reminder>();
  @Output() closeDialog = new EventEmitter<void>();

  datePart = signal<string>('');
  timePart = signal<string>('');
  isSubmitted = signal(false);
  
  constructor(private reminderApi: RemindersApi){
    effect(() => {
      const reminder = this.reminderSignal();
      if (reminder) {

        const date = reminder.remind_at;

        this.datePart.set(date.toISOString().slice(0, 10));
        this.timePart.set(date.toISOString().slice(11, 16));

        this.formModel.set({
          remind_at: reminder.remind_at
        });
      }
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
    const reminder = this.reminderSignal();
    if (!reminder) return;
    
    this.reminderApi.updateReminder(reminder.id, body).subscribe({
      next: (reminder: Reminder) => {
        this.reminderUpdated.emit(reminder);
        this.closeDialog.emit();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

}
