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

type Tab = 'singleReminder' | 'recurrenceReminder';

@Component({
  selector: 'app-create-task',
  imports: [CommonModule, MatSelectModule, MatFormFieldModule],
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

  constructor(
    private tasksApi: TasksApi, 
    private auth: Auth, 
    private categoriesApi: CategoriesApi, 
    private router: Router
  ){
    effect(() => {
      this.formModel.update(f => ({
        ...f,
        due_date: this.dueDateComputed(),
        exact_remind_at: this.withReminder() ? this.exactRemindAtComputed() : null
      }));
    });
  }

  setTab(tab: Tab) {
    this.activeTab.set(tab);
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
        recurrence_rule: null,
        recurrence_interval: null
      });
    }

    this.categoriesApi.getAllCategories().subscribe((data: Category[]) => {
      this.allCategories.set(data);
    });
  }

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

  updateName(value: string) { this.formModel.update(f => ({ ...f, title: value })); }
  updateDescription(value: string) { this.formModel.update(f => ({ ...f, description: value })); }
  updateCategory(value: number | string ) { this.formModel.update(f => ({ ...f, category_id: Number(value) })); }
  updatePriority(value: number | string ) { this.formModel.update(f => ({ ...f, priority: Number(value) })); }
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

  createTask(body: CreateTaskDto) {
    this.tasksApi.createTask(body).subscribe({
      next: (task: Task) => {
        console.log(task);
        this.router.navigate(['/home']);
      },
      error: (err) => console.error(err)
    });
  }
}
