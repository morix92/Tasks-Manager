import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Task } from '../../../models/task.model';
import { CreateTaskDto } from '../../../models/createTask.model';
import { UpdateTaskDto } from '../../../models/updateTask.model';

@Injectable({
  providedIn: 'root',
})
export class TasksApi {
    
  private http: HttpClient = inject(HttpClient);

  url = "http://localhost:3000/tasks"

  getAllTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.url}`)
  }

  getTaskById(id:number): Observable<Task> {
    return this.http.get<Task>(`${this.url}/${id}`)
  }

  getTasksByUserId(user_id: number, status?: number): Observable<Task[]> {
    
    let params = new HttpParams();

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    return this.http.get<Task[]>(`${this.url}/user/${user_id}`, { params })
  }

  createTask(body:CreateTaskDto): Observable<Task> {
    
    const bodyForBE = {
      ...body,
      due_date: this.formatLocalForBE(body.due_date),
      exact_remind_at: this.formatLocalForBE(body.exact_remind_at)
    };

    return this.http.post<Task>(`${this.url}`, bodyForBE)
  } 

  updateTask(id: number, body: UpdateTaskDto): Observable<Task> {
    return this.http.put<Task>(`${this.url}/${id}`, body)
  }

  completeTask(id: number): Observable<Task>   {
    return this.http.put<Task>(`${this.url}/complete/${id}`, null)
  }

  deleteTask(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }

  formatLocalForBE(date: Date | null): string | null {
    if (!date) return null;
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      date.getFullYear() + '-' +
      pad(date.getMonth() + 1) + '-' +
      pad(date.getDate()) + ' ' +
      pad(date.getHours()) + ':' +
      pad(date.getMinutes()) + ':' +
      pad(date.getSeconds())
    );
  }

}
