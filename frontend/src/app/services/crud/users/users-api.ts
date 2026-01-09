import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../../../models/user.model';
import { CreateUserDto } from '../../../models/createUser.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UsersApi {

  private http: HttpClient = inject(HttpClient);

  url = "http://localhost:3000/users"

getAllUsers(): Observable<User[]> {
  return this.http.get<User[]>(`${this.url}`);
}

getUserById(id:number): Observable<User> {
  return this.http.get<User>(`${this.url}/${id}`)
}
  
createUser(body:CreateUserDto): Observable<User> {
  return this.http.post<User>(`${this.url}`, body)
} 

updateUser(id: number, body: CreateUserDto): Observable<User> {
  return this.http.put<User>(`${this.url}/${id}`, body)
}

deleteUser(id: number){
  return this.http.delete(`${this.url}/${id}`)
}

}
