import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { UsersApi } from '../../services/crud/users/users-api';
import { User } from '../../models/user.model';
import { MatIconModule } from '@angular/material/icon';
import { AddProfile } from './add-profile/add-profile';
import { EditProfile } from './edit-profile/edit-profile';
import { Auth } from '../../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profiles',
  imports: [CommonModule, MatIconModule, AddProfile, EditProfile],
  templateUrl: './profiles.html',
  styleUrl: './profiles.css',
})
export class Profiles {

  allUsers = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  showDialogAddUser = signal<boolean>(false);
  showDialogEditUser = signal<boolean>(false);

  constructor(private usersApi: UsersApi, private auth: Auth, private router: Router){}
  
  ngOnInit() {
    this.usersApi.getAllUsers().subscribe((data: User[]) => {
      this.allUsers.set(data);
    });
  }

  addUser(){
    this.showDialogAddUser.set(true);
  }

  onUserCreated(user: User) {
    this.allUsers.set([...this.allUsers(), user]);
    this.showDialogAddUser.set(false);
  }

  editUser(id: number) {
    this.usersApi.getUserById(id).subscribe((data: User) => {
      this.selectedUser.set(data);
      this.showDialogEditUser.set(true);
    });
  }

  onUserUpdated(user: User) {
    const updatedUsers = this.allUsers().map(u => u.id === user.id ? user : u);
    this.allUsers.set(updatedUsers);
    this.showDialogEditUser.set(false);
  }
  
  closeDialog(event: Event){
    this.showDialogAddUser.set(false);
    this.showDialogEditUser.set(false);
  }

  deleteUser(id: number) {
    this.usersApi.deleteUser(id).subscribe(()=>{
      const filteredUsers = this.allUsers().filter(u => u.id !== id);
      this.allUsers.set(filteredUsers);
      console.log("Utente eliminato")  
    })
  }

  login(user: User){
    this.auth.login(user);
    this.router.navigate(['/home']);
  }
}
