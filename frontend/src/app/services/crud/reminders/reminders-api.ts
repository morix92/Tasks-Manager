import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Reminder } from '../../../models/reminder.model';
import { CreateReminderDto } from '../../../models/createReminder.model';
import { UpdateReminderDto } from '../../../models/updateReminder.model';

@Injectable({
  providedIn: 'root',
})
export class RemindersApi {
  
  private http: HttpClient = inject(HttpClient);

  url = "http://localhost:3000/reminders"

  getAllReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.url}`)
  }

  getReminderById(id:number): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.url}/${id}`)
  }

  getRemindersByUserId(user_id:number, is_sent:number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.url}/user/${user_id}?is_sent=${is_sent}`)
  }

  getReminderByTask(task_id: number, limit: boolean): Observable<Reminder[]>{
    return this.http.get<Reminder[]>(`${this.url}/task/${task_id}?limit=${limit}`)
  }

  createReminder(body:CreateReminderDto): Observable<Reminder> {
    return this.http.post<Reminder>(`${this.url}`, body)
  } 

  updateReminder(id: number, body: UpdateReminderDto): Observable<Reminder> {
    return this.http.put<Reminder>(`${this.url}/${id}`, body)
  }

  deleteReminder(id: number){
    return this.http.delete(`${this.url}/${id}`)
  }


}
