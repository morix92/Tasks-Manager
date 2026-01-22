import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Task } from '../../../../models/task.model';
import { Category } from '../../../../models/category.model';
import { CreateTaskDto } from '../../../../models/createTask.model';
import { TasksApi } from '../../../../services/crud/tasks/tasks-api';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CommonModule } from '@angular/common';


type Tab = 'singleReminder' | 'recurrenceReminder';

@Component({
  selector: 'app-reopen-task',
  imports: [CommonModule],
  templateUrl: './reopen-task.html',
  styleUrl: './reopen-task.css',
})
export class ReopenTask {

  @Input({ required: true }) task!: Task | null;
  @Output() taskCreated = new EventEmitter<Task>();
  @Output() closeDialog = new EventEmitter<void>();
  

  isSubmitted = signal(false);
  recurrenceRule = signal([{input: 'oraria', value: 'hourly' },{input: 'giornaliera', value: 'daily'},{input: 'settimanale', value: 'weekly'},{input: 'mensile', value: 'monthly'},{input: 'annuale', value: 'yearly'}]);
  datePart = signal<string>('');
  timePart = signal<string>('');
  withReminder = signal<boolean>(false);
  activeTab = signal<Tab>('singleReminder');
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
    recurrence_rule: null,
    recurrence_interval: null
  });

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

  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    // Data / ora scadenza
    if (!this.datePart()) errors['datePart'] = 'La Data di Scadenza è obbligatoria';
    if (!this.timePart()) errors['timePart'] = 'Inserire un orario di Scadenza';

    // Reminder
    if (this.withReminder()) {
      if (this.activeTab() === 'singleReminder') {
        if (!this.reminderDatePart()) errors['reminderDatePart'] = 'Data notifica obbligatoria';
        if (!this.reminderTimePart()) errors['reminderTimePart'] = 'Ora notifica obbligatoria';
        if (f.exact_remind_at && (!(f.exact_remind_at instanceof Date) || isNaN(f.exact_remind_at.getTime()))) {
          errors['exact_remind_at'] = 'La Data di Notifica deve essere valida';
        }
      } else if (this.activeTab() === 'recurrenceReminder') {
        if (!f.recurrence_rule) errors['recurrence_rule'] = 'Il campo Regola Ricorrenza è obbligatorio';
        if (!f.recurrence_interval) errors['recurrence_interval'] = 'Il campo Numero Ricorrenza è obbligatorio';
        if (f.recurrence_interval && f.recurrence_interval < 1) errors['recurrence_interval'] = 'Il campo Numero Ricorrenza non può essere minore o uguale a zero';
      }
    }
    console.log(errors);
    return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  constructor(private tasksApi: TasksApi){

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
          recurrence_rule: null,
          recurrence_interval: null
        });
      }
    });

    effect(() => {
      this.formModel.update(f => ({
        ...f,
        due_date: this.dueDateComputed(),
        exact_remind_at: this.withReminder() ? this.exactRemindAtComputed() : null
      }));
    });
  }

  setTab(tab: Tab) {this.activeTab.set(tab);}

  setwithReminder(choice: boolean) { 
    this.withReminder.set(choice); 

    if (!choice) {
      this.activeTab.set('singleReminder');
      this.reminderDatePart.set('');
      this.reminderTimePart.set('');

      this.formModel.update(f => ({
        ...f,
        exact_remind_at: null,
        recurrence_rule: null,
        recurrence_interval: null
      }));
    }
  }

  updateDueDate(value: Date) { this.formModel.update(f => ({ ...f, due_date: value })); }
  updateExactReminderAt(value: Date) { this.formModel.update(f => ({ ...f, exact_remind_at: value })); }
  updateRecurrenceRule(value: string) { this.formModel.update(f => ({ ...f, recurrence_rule: value })); }
  updateRecurrenceInterval(value: number | string) { this.formModel.update(f => ({ ...f, recurrence_interval: Number(value) })); }

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
      },
      error: (err) => console.error(err)
    });
  }

}

