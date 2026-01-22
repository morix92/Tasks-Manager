import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Task } from '../../../../models/task.model';
import { Category } from '../../../../models/category.model';
import { TasksApi } from '../../../../services/crud/tasks/tasks-api';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CommonModule } from '@angular/common';
import { UpdateTaskDto } from '../../../../models/updateTask.model';

@Component({
  selector: 'app-edit-task',
  imports: [CommonModule],
  templateUrl: './edit-task.html',
  styleUrl: './edit-task.css',
})
export class EditTask {

  @Input({ required: true }) task!: Task | null;
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() closeDialog = new EventEmitter<void>();
  

  isSubmitted = signal(false);
  taskId = signal<number>(0);
  allCategories = signal<Category[]>([]);
  priorities = signal([{id: 1, value: 'Alta' },{id: 2, value: 'Media'},{id: 3, value: 'Bassa'}]);
  
  formModel = signal<UpdateTaskDto>({
    category_id: 0,
    title: '',
    description: '',
    priority: 0
  });

  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    // Nome attività
    if (!f.title) errors['title'] = 'Il Nome Attività è obbligatorio';

    // Priorità e categoria
    if (!f.priority) errors['priority'] = 'Il campo Priorità è obbligatorio';
    if (!f.category_id) errors['category_id'] = 'Il campo Categoria è obbligatorio';

    return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  constructor(private tasksApi: TasksApi, private categoriesApi: CategoriesApi){

    effect(() => {
      if (this.task) {
        this.taskId.set(this.task.id);
        console.log("test: "+JSON.stringify(this.task))
        this.formModel.set({
          category_id: this.task.category_id,
          title: this.task.title,
          description: this.task.description,
          priority: this.task.priority
        });
      }
    });

    effect(() => {
      this.formModel.update(f => ({
        ...f,
      }));
    });

    this.categoriesApi.getAllCategories().subscribe((data: Category[]) => {
      this.allCategories.set(data);
    });
  }

  updateName(value: string) { this.formModel.update(f => ({ ...f, title: value })); }
  updateDescription(value: string) { this.formModel.update(f => ({ ...f, description: value })); }
  updateCategory(value: number | string ) { this.formModel.update(f => ({ ...f, category_id: Number(value) })); }
  updatePriority(value: number | string ) { this.formModel.update(f => ({ ...f, priority: Number(value) })); }

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.updateTask(this.taskId(), this.formModel());
  }

  updateTask(id: number, body: UpdateTaskDto) {
    this.tasksApi.updateTask(id, body).subscribe({
      next: (task: Task) => {
        this.taskUpdated.emit(task);
        this.closeDialog.emit();
      },
      error: (err) => console.error(err)
    });
  }

}
