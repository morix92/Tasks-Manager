import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Avatars {
  
  private http: HttpClient = inject(HttpClient);

  url = "http://localhost:3000/avatars"

  getAvatars(): Observable<string[]> {
    return this.http.get<string[]>('http://localhost:3000/avatars');
  }

}
