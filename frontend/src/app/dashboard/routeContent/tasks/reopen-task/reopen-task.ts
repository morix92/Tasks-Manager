import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Task } from '../../../../models/task.model';
import { CreateTaskDto } from '../../../../models/createTask.model';
import { TasksApi } from '../../../../services/crud/tasks/tasks-api';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../../services/alert';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';

@Component({
  selector: 'app-reopen-task',
  imports: [CommonModule, MatTooltipModule, MatButtonModule, MatIcon],
  templateUrl: './reopen-task.html',
  styleUrl: './reopen-task.css',
})
export class ReopenTask {

  @Input({ required: true }) task!: Task | null;
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() closeDialog = new EventEmitter<void>();

  isSubmitted = signal(false);

  recurrenceRule = signal([
    {input: 'oraria', value: 'hourly' },
    {input: 'giornaliera', value: 'daily'},
    {input: 'settimanale', value: 'weekly'},
    {input: 'mensile', value: 'monthly'},
    {input: 'annuale', value: 'yearly'}
  ]);

  datePart = signal<string>('');
  timePart = signal<string>('');

  withReminder = signal<boolean>(false);
  withRecurrence = signal<boolean>(false);
  useReminderExact  = signal<boolean>(false);
  useReminderOffset = signal<boolean>(false);

  reminderDatePart = signal<string>('');
  reminderTimePart = signal<string>('');

  formModel = signal<CreateTaskDto>({
    user_id: 0,
    category_id: 0,
    title: '',
    description: '',
    priority: 0,
    due_date: new Date(),
    exact_remind_at: null,
    remind_offset_minutes: null,
    recurrence_rule: null,
    recurrence_interval: null,
    occurrences: null
  });

  // Scadenza composta da data + ora
  dueDateComputed = computed<Date>(() => {
    const date = this.datePart();
    const time = this.timePart();
    if (!date || !time) return this.formModel().due_date;
    return new Date(`${date}T${time}`);
  });

  // Remind esatto composto da data + ora
  exactRemindAtComputed = computed<Date | null>(() => {
    const date = this.reminderDatePart();
    const time = this.reminderTimePart();
    if (!date || !time) return null;
    const dt = new Date(`${date}T${time}`);
    return isNaN(dt.getTime()) ? null : dt;
  });

  // Errori di validazione
  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    // Data / ora scadenza
    if (!this.datePart()) errors['datePart'] = 'La Data di Scadenza è obbligatoria';
    if (!this.timePart()) errors['timePart'] = 'Inserire un orario di Scadenza';

    // Reminder
    if (this.withReminder()) {
      const useExact  = this.useReminderExact();
      const useOffset = this.useReminderOffset();

      if (!useExact && !useOffset) {
        errors['reminder'] = 'Selezionare una modalità di notifica';
      } else if (useExact && useOffset) {
        errors['reminder'] = 'Scegliere una sola tipologia di notifica';
      } else if (useExact) {
        if (!this.reminderTimePart() && !this.reminderDatePart()) {
          errors['reminderDate'] = 'Data/Ora del promemoria non valida';
        } else if (!this.reminderTimePart()) {
          errors['reminderDate'] = 'Inserire l’ora del promemoria';
        } else if (!this.reminderDatePart()) {
          errors['reminderDate'] = 'Inserire la data del promemoria';
        }
      } else if (useOffset) {
        const minutes = f.remind_offset_minutes;
        if (minutes == null || isNaN(minutes) || minutes <= 0) {
          errors['reminderOffset'] = 'Inserire minuti > 0';
        }
      }
    }
    // Ricorrenze
    if (this.withRecurrence()) {
      if (!f.recurrence_rule || !f.recurrence_interval || !f.occurrences) {
        errors['recurrenceRule'] = 'Inserire una regola valida';
      }
    }

    return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  constructor(private tasksApi: TasksApi, private alertService: Alert) {
    // Inizializzazione a partire dal task
    effect(() => {
      if (this.task) {
        this.formModel.set({
          user_id: this.task.user_id,
          category_id: this.task.category_id,
          title: this.task.title,
          description: this.task.description,
          priority: this.task.priority,
          due_date: new Date(),
          exact_remind_at: null,
          remind_offset_minutes: null,
          recurrence_rule: null,
          recurrence_interval: null,
          occurrences: null
        });
      }
    });

    // Mantiene coerenti i campi derivati
    effect(() => {
      const withRem   = this.withReminder();
      const useExact  = this.useReminderExact();

      this.formModel.update(f => ({
        ...f,
        due_date: this.dueDateComputed(),
        exact_remind_at: withRem && useExact ? this.exactRemindAtComputed() : null
      }));
    });
  }

  // ====== Toggle e setter ======

  setWithReminder(choice: boolean) {
    this.withReminder.set(choice);

    if (choice) {
      // Default: abilito la modalità Data/Ora esatta
      this.useReminderExact.set(true);
      this.useReminderOffset.set(false);
      // reset coerente per offset
      this.formModel.update(f => ({ ...f, remind_offset_minutes: null }));
    } else {
      // Pulizia completa quando non si vogliono promemoria
      this.useReminderExact.set(false);
      this.useReminderOffset.set(false);
      this.reminderDatePart.set('');
      this.reminderTimePart.set('');
      this.formModel.update(f => ({
        ...f,
        exact_remind_at: null,
        remind_offset_minutes: null
      }));
    }
  }

  setUseReminderExact(choice: boolean) {
    this.useReminderExact.set(choice);

    if (choice) {
      // Se scelgo la modalità esatta, disattivo offset
      this.useReminderOffset.set(false);
      this.formModel.update(f => ({ ...f, remind_offset_minutes: null }));
    } else {
      // Se la disattivo, ripulisco i campi data/ora
      this.reminderDatePart.set('');
      this.reminderTimePart.set('');
      this.formModel.update(f => ({ ...f, exact_remind_at: null }));
    }
  }

  setUseReminderOffset(choice: boolean) {
    this.useReminderOffset.set(choice);

    if (choice) {
      // Se scelgo la modalità offset, disattivo esatta
      this.useReminderExact.set(false);
      this.reminderDatePart.set('');
      this.reminderTimePart.set('');
      this.formModel.update(f => ({ ...f, exact_remind_at: null }));
    } else {
      // Se la disattivo, ripulisco i minuti
      this.formModel.update(f => ({ ...f, remind_offset_minutes: null }));
    }
  }

  setWithRecurrence(choice: boolean) { 
    this.withRecurrence.set(choice); 

    if (!choice) {

      this.formModel.update(f => ({
        ...f,
        recurrence_rule: null,
        recurrence_interval: null,
        occurrences: null
      }));
    }
  }

  // ====== Aggiornatori semplici ======

  updateRecurrenceRule(value: string) {
    this.formModel.update(f => ({ ...f, recurrence_rule: value }));
  }

  updateRecurrenceInterval(value: number | string) {
    this.formModel.update(f => ({ ...f, recurrence_interval: Number(value) }));
  }

  updateremindOffsetMinutes(value: number | string) {
    const n = Number(value);
    this.formModel.update(f => ({
      ...f,
      remind_offset_minutes: isNaN(n) ? null : n
    }));
  }

  updateoccurrences(value: number | string) {
    this.formModel.update(f => ({ ...f, occurrences: Number(value) }));
  }

  // ====== Submit ======

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.createTask(this.formModel());
  }

  createTask(body: CreateTaskDto) {
    this.tasksApi.createTask(body).subscribe({
      next: (task: Task) => {
        this.taskCreated.emit(task);
        this.closeDialog.emit();
        this.alertService.sendAlert({
          message: `Attività ${task.title} ricreata con successo`,
          classAlert: 'success'
        });
      },
      error: (err) => console.error(err)
    });
  }
}