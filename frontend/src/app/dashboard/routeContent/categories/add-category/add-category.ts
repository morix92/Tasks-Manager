import { Component, EventEmitter, Output, signal } from '@angular/core';
import { Category } from '../../../../models/category.model';
import { CategoriesApi } from '../../../../services/crud/categories/categories-api';
import { CreateCategoryDto } from '../../../../models/createCategory.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-category',
  imports: [CommonModule],
  templateUrl: './add-category.html',
  styleUrl: './add-category.css',
})
export class AddCategory {

  colors: string[] = [ 
    "#ee122a", "#b00b69", "#e85b2e", "#f2992e", "#fdb9c9", "#ab9cff", "#542179", "#c8edff", "#6cadf9", 
    "#0041c2", "#00fff2", "#6ea47b", "#68fc66", "#844703", "#afafbf", "#fbf6eb", "#fae552", "#ffc917"
];

  @Output() categoryCreated = new EventEmitter<Category>();
  @Output() closeDialog = new EventEmitter<void>();
  
  constructor(private categoryApi: CategoriesApi){}

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
    this.createCategory(this.formModel());
  }

  createCategory(body: CreateCategoryDto) {
  this.categoryApi.createCategory(body).subscribe({
    next: (category: Category) => {
      this.categoryCreated.emit(category);
      this.closeDialog.emit();
    },
    error: (err) => {
      console.error(err);
    }
  });
  }

}
