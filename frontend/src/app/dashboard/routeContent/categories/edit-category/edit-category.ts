import { Component, effect, EventEmitter, Input, Output, signal } from '@angular/core';
import { Category } from '../../../../models/category.model';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CreateCategoryDto } from '../../../../models/createCategory.model';
import { CommonModule } from '@angular/common';

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
  
  constructor(private categoryApi: CategoriesApi){
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

  updateName(value: string) {
    this.formModel.set({ ...this.formModel(), name: value });
  }

  updateColor(color: string) {
    this.formModel.set({ ...this.formModel(), color: color });
  }

  submit(event: Event) {
    event.preventDefault();
    this.updateCategory(this.formModel());
  }

  updateCategory(body: CreateCategoryDto) {
    const category = this.categorySignal();
    if (!category) return;
    
    this.categoryApi.updateCategory(category.id, body).subscribe({
      next: (category: Category) => {
        this.categoryUpdated.emit(category);
        this.closeDialog.emit();
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
  
}
