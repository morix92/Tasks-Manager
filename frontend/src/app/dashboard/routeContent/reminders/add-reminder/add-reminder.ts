import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Reminder } from '../../../../models/reminder.model';
import { RemindersApi } from '../../../../services/crud/reminders/reminders-api';
import { CreateReminderDto } from '../../../../models/createReminder.model';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../../services/alert';

@Component({
  selector: 'app-add-reminder',
  imports: [CommonModule],
  templateUrl: './add-reminder.html',
  styleUrl: './add-reminder.css',
})
export class AddReminder {

  @Input() taskIdSignal = signal<number | null>(null);
  @Output() reminderCreated = new EventEmitter<Reminder>();
  @Output() closeDialog = new EventEmitter<void>();

  datePart = signal<string>('');
  timePart = signal<string>('');
  isSubmitted = signal(false);

  constructor(private reminderApi: RemindersApi, private alertService: Alert){
      effect(() => {
        const taskId = this.taskIdSignal();
        if (taskId) {
          this.formModel.set({
            task_id: taskId,
            remind_at: this.remindAtComputed()
          });
        }
      });
  }

  formModel = signal<CreateReminderDto>({
    task_id: 0,
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
    const errors: Record<string, string> = {};

    if (!this.datePart()) {
      errors['datePart'] = 'La Data è obbligatoria';
    }
    if (!this.timePart()) {
      errors['timePart'] = 'Inserire un orario';
    }
  return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  updateRemindAt(value: string) {
    this.formModel.set({ ...this.formModel(), remind_at: new Date(value) });
  }

  submit(event: Event) {
    event.preventDefault();
    const task_id = this.taskIdSignal();
    if (task_id) {
      this.isSubmitted.set(true);
      if (!this.isValidForm()) return;
      this.addReminder(this.formModel());
    } else {
      console.log("Errore nella lettura del task_id")
      return;
    }
  }

  addReminder(body: CreateReminderDto) {
    this.reminderApi.createReminder(body).subscribe({
      next: (reminder: Reminder) => {
        this.reminderCreated.emit(reminder);
        this.closeDialog.emit();
        this.alertService.sendAlert({
          message: `Promemoria aggiunto all'attività: ${reminder.task_title}`,
          classAlert: 'success'
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
