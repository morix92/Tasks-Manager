import { Component, computed, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Category } from '../../../../models/category.model';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CreateCategoryDto } from '../../../../models/createCategory.model';
import { CommonModule } from '@angular/common';
import { Alert } from '../../../../services/alert';

@Component({
  selector: 'app-edit-category',
  imports: [CommonModule],
  templateUrl: './edit-category.html',
  styleUrl: './edit-category.css',
})
export class EditCategory {

  colors: string[] = [ 
    "#ee122a", "#b00b69", "#e85b2e", "#f2992e", "#fdb9c9", "#ab9cff", "#542179", "#c8edff", "#6cadf9", 
    "#0041c2", "#00fff2", "#6ea47b", "#68fc66", "#844703", "#afafbf", "#fbf6eb", "#fae552", "#ffc917"
];

  @Input() categorySignal = signal<Category | null>(null);
  @Output() categoryUpdated = new EventEmitter<Category>();
  @Output() closeDialog = new EventEmitter<void>();

  isSubmitted = signal(false);
  
  constructor(private categoryApi: CategoriesApi, private alertService: Alert){
    effect(() => {
      const category = this.categorySignal();
      if (category) {
        this.formModel.set({
          name: category.name,
          color: category.color || ''
        });
      }
    });
  }

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
    this.updateCategory(this.formModel());
  }

  updateCategory(body: CreateCategoryDto) {
    const category = this.categorySignal();
    if (!category) return;
    
    this.categoryApi.updateCategory(category.id, body).subscribe({
      next: (category: Category) => {
        this.categoryUpdated.emit(category);
        this.closeDialog.emit();
        this.alertService.sendAlert({
            message: `Categoria ${category.name} modificata con successo`,
            classAlert: 'success'
        });
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
}
