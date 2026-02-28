import { Component, computed, effect, signal } from '@angular/core';
import { TasksApi } from '../../../../services/crud/tasks/tasks-api';
import { CreateTaskDto } from '../../../../models/createTask.model';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { Task } from '../../../../models/task.model';
import { Router } from '@angular/router';
import { Category } from '../../../../models/category.model';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../../services/auth';
import { Alert } from '../../../../services/alert';
import {MatTooltipModule} from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-create-task',
  imports: [CommonModule, MatSelectModule, MatFormFieldModule, MatTooltipModule, MatIcon],
  templateUrl: './create-task.html',
  styleUrl: './create-task.css',
})
export class CreateTask {

  isSubmitted = signal(false);
  allCategories = signal<Category[]>([]);
  currentUser = computed(() => this.auth.currentUser());
  priorities = signal([{id: 1, value: 'Alta' },{id: 2, value: 'Media'},{id: 3, value: 'Bassa'}]);
  recurrenceRule = signal([{input: 'oraria', value: 'hourly' },{input: 'giornaliera', value: 'daily'},{input: 'settimanale', value: 'weekly'},{input: 'mensile', value: 'monthly'},{input: 'annuale', value: 'yearly'}]);
  datePart = signal<string>('');
  timePart = signal<string>('');

  withReminder = signal<boolean>(false);
  withRecurrence = signal<boolean>(false);
  reminderDatePart = signal<string>('');
  reminderTimePart = signal<string>('');

  useReminderExact  = signal<boolean>(false);
  useReminderOffset = signal<boolean>(false);

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

  constructor(
    private tasksApi: TasksApi, 
    private auth: Auth, 
    private categoriesApi: CategoriesApi, 
    private router: Router,
    private alertService: Alert
  ){
    effect(() => {
      this.formModel.update(f => ({
        ...f,
        due_date: this.dueDateComputed(),
        exact_remind_at: this.withReminder() ? this.exactRemindAtComputed() : null
      }));
    });
  }

  dueDateComputed = computed<Date>(() => {
    const date = this.datePart();
    const time = this.timePart();

    if (!date || !time) return this.formModel().due_date;

    return new Date(`${date}T${time}`);
  });

  exactRemindAtComputed = computed<Date | null>(() => {
    const date = this.reminderDatePart();
    const time = this.reminderTimePart();

    if (!date || !time) return null;

    const dt = new Date(`${date}T${time}`);
    return isNaN(dt.getTime()) ? null : dt;
  });

  ngOnInit() {
    // Imposto l'utente solo una volta
    const idUser = this.currentUser()?.id;
    if (idUser) {
      this.formModel.set({
        user_id: idUser,
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
    }

    this.categoriesApi.getAllCategories().subscribe((data: Category[]) => {
      this.allCategories.set(data);
    });
  }

  // ====== Gestione Errori Form ======

  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    // Nome attività
    if (!f.title) errors['title'] = 'Il Nome Attività è obbligatorio';

    // Data / ora scadenza
    if (!this.datePart()) errors['datePart'] = 'La Data di Scadenza è obbligatoria';
    if (!this.timePart()) errors['timePart'] = 'Inserire un orario di Scadenza';

    // Priorità e categoria
    if (!f.priority) errors['priority'] = 'Il campo Priorità è obbligatorio';
    if (!f.category_id) errors['category_id'] = 'Il campo Categoria è obbligatorio';

    // Reminder
    if (this.withReminder()) {
      const useExact  = this.useReminderExact();
      const useOffset = this.useReminderOffset();

      if (!useExact && !useOffset) {
        errors['reminder'] = 'Selezionare una delle 2 modalità di notifica';
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

  // ====== Aggiornamento Campi ======

  updateName(value: string) { this.formModel.update(f => ({ ...f, title: value })); }
  updateDescription(value: string) { this.formModel.update(f => ({ ...f, description: value })); }
  updateCategory(value: number | string ) { this.formModel.update(f => ({ ...f, category_id: Number(value) })); }
  updatePriority(value: number | string ) { this.formModel.update(f => ({ ...f, priority: Number(value) })); }
  updateDueDate(value: Date) { this.formModel.update(f => ({ ...f, due_date: value })); }
  updateExactReminderAt(value: Date) { this.formModel.update(f => ({ ...f, exact_remind_at: value })); }
  updateRecurrenceRule(value: string) { this.formModel.update(f => ({ ...f, recurrence_rule: value })); }
  updateRecurrenceInterval(value: number | string) { this.formModel.update(f => ({ ...f, recurrence_interval: Number(value) })); }
  updateoccurrences(value: number | string) { this.formModel.update(f => ({ ...f, occurrences: Number(value) })); }
  updateremindOffsetMinutes(value: number | string) {
    const n = Number(value);
    this.formModel.update(f => ({
      ...f,
      remind_offset_minutes: isNaN(n) ? null : n
    }));
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

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.createTask(this.formModel());
  }

  createTask(body: CreateTaskDto) {
    this.tasksApi.createTask(body).subscribe({
      next: (task: Task | Task[]) => {
    
        const firstTask = Array.isArray(task) ? task[0] : task;
        
        this.alertService.sendAlert({
            message: `Attività ${firstTask.title} creata con successo`,
            classAlert: 'success'
        });
        this.router.navigate(['/home']);
      },
      error: (err) => console.error(err)
    });
  }
}
