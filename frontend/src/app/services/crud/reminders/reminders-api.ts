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

  url = "http://127.0.0.1:3000/reminders"

  getAllReminders(): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.url}`)
  }

  getReminderById(id:number): Observable<Reminder> {
    return this.http.get<Reminder>(`${this.url}/${id}`)
  }

  getRemindersByUserId(user_id:number, is_sent:number): Observable<Reminder[]> {
    return this.http.get<Reminder[]>(`${this.url}/user/${user_id}?is_sent=${is_sent}`)
  }

  getReminderByTask(task_id: number, is_sent: number): Observable<Reminder[]>{
    return this.http.get<Reminder[]>(`${this.url}/task/${task_id}?is_sent=${is_sent}`)
  }

  createReminder(body:CreateReminderDto): Observable<Reminder> {

    const bodyForBE = {
      ...body,
      remind_at: this.formatLocalForBE(body.remind_at)
    }

    return this.http.post<Reminder>(`${this.url}`, bodyForBE)
  } 

  updateReminder(id: number, body: UpdateReminderDto): Observable<Reminder> {

    const bodyForBE = {
      ...body,
      remind_at: this.formatLocalForBE(body.remind_at)
    }

    return this.http.put<Reminder>(`${this.url}/${id}`, bodyForBE)
  }

  deleteReminder(id: number){
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
