import { Component, computed, EventEmitter, Output, signal } from '@angular/core';
import { Category } from '../../../../models/category.model';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CreateCategoryDto } from '../../../../models/createCategory.model';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../../services/alert';

@Component({
  selector: 'app-add-category',
  imports: [CommonModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.css',
})
export class AddCategory {

  colors: string[] = [ 
    "#ee122a", "#b00b69", "#e85b2e", "#f2992e", "#fdb9c9", "#ab9cff", "#542179", "#c8edff", "#6cadf9", 
    "#0041c2", "#00fff2", "#6ea47b", "#68fc66", "#844703", "#afafbf", "#dfdfdf", "#fae552", "#ffc917"
];

  isSubmitted = signal(false);

  @Output() categoryCreated = new EventEmitter<Category>();
  @Output() closeDialog = new EventEmitter<void>();

  constructor(private categoryApi: CategoriesApi, private alertService: Alert){}

  formModel = signal<CreateCategoryDto>({
    name: '',
    color: ''
  });

  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    if (!f.name) {
      errors['name'] = 'Il campo Nome è obbligatorio';
    } else if (f.name.trim().length < 3) {
      errors['name'] = 'Il campo Nome deve contenere almeno 3 caratteri';
    }
    if (!f.color) errors['color'] = 'Selezionare un colore';
    return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);

  updateName(value: string) {
    this.formModel.set({ ...this.formModel(), name: value });
  }

  updateColor(color: string) {
    this.formModel.set({ ...this.formModel(), color: color });
  }

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.createCategory(this.formModel());
  }

  createCategory(body: CreateCategoryDto) {
  this.categoryApi.createCategory(body).subscribe({
    next: (category: Category) => {
      this.categoryCreated.emit(category);
      this.closeDialog.emit();
      this.alertService.sendAlert({
          message: `Categoria ${category.name} creata con successo`,
          classAlert: 'success'
      });
    },
    error: (err) => {
      console.error(err);
    }
  });
  }

}
