import { Component, signal } from '@angular/core';
import { CategoriesApi } from '../../../services/crud/categories/categories-api';
import { Category } from '../../../models/category.model';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AddCategory } from './add-category/add-category';
import { EditCategory } from './edit-category/edit-category';

@Component({
  selector: 'app-categories',
  imports: [MatIconModule, CommonModule, AddCategory, EditCategory],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories {

  allCategories = signal<Category[]>([]);
  selectedCategory = signal<Category | null>(null);
  showDialogAddCategory = signal<boolean>(false);
  showDialogEditCategory = signal<boolean>(false);

  constructor(private categoriesApi: CategoriesApi){}

  ngOnInit(){
    this.categoriesApi.getAllCategories().subscribe((data: Category[]) => {
      this.allCategories.set(data);
    })
  }

  addCategory(){
    this.showDialogAddCategory.set(true);
  }

  onCategoryCreated(category: Category) {
    this.allCategories.set([...this.allCategories(), category]);
    this.showDialogAddCategory.set(false);
  }

  editCategory(id: number) {
    this.categoriesApi.getCategoryById(id).subscribe((data: Category) => {
      this.selectedCategory.set(data);
      this.showDialogEditCategory.set(true);
    });
  }

  onCategoryUpdated(category: Category) {
    const updatedCategories = this.allCategories().map(u => u.id === category.id ? category : u);
    this.allCategories.set(updatedCategories);
    this.showDialogAddCategory.set(false);
  }

  closeDialog(event: Event){
    this.showDialogAddCategory.set(false);
    this.showDialogEditCategory.set(false);
  }

  deleteCategory(id: number) {
    this.categoriesApi.deleteCategory(id).subscribe(()=>{
      const filteredCategories = this.allCategories().filter(u => u.id !== id);
      this.allCategories.set(filteredCategories);
      console.log("Categoria eliminata")  
    })
  }

}