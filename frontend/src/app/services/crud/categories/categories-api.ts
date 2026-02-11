import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Category } from '../../../models/category.model';
import { CreateCategoryDto } from '../../../models/createCategory.model';

@Injectable({
  providedIn: 'root',
})
export class CategoriesApi {
  
  private http: HttpClient = inject(HttpClient);

  url = "http://127.0.0.1:3000/categories"

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.url}`);
  }

  getCategoryById(id:number): Observable<Category> {
    return this.http.get<Category>(`${this.url}/${id}`)
  }
    
  getCategoriesByName(name:string): Observable<Category> {
    return this.http.get<Category>(`${this.url}/name/${name}`)
  }

  createCategory(body:CreateCategoryDto): Observable<Category> {
    return this.http.post<Category>(`${this.url}`, body)
  } 

  updateCategory(id: number, body: CreateCategoryDto): Observable<Category> {
    return this.http.put<Category>(`${this.url}/${id}`, body)
  }

  deleteCategory(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }

}
