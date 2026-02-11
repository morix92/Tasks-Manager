import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Avatars {
  
  private http: HttpClient = inject(HttpClient);

  url = "http://127.0.0.1:3000"

  getAvatars(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/avatars`);
  }

}
