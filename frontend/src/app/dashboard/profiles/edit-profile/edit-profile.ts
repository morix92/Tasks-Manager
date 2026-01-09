import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, signal, effect } from '@angular/core';
import { User } from '../../../models/user.model';
import { CreateUserDto } from '../../../models/createUser.model';
import { UsersApi } from '../../../services/crud/users/users-api';
import { Avatars } from '../../../services/avatars';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css',
})
export class EditProfile {

  @Input() userSignal = signal<User | null>(null);
  @Output() userUpdated = new EventEmitter<User>();
  @Output() closeDialog = new EventEmitter<void>();

  formModel = signal<CreateUserDto>({
    username: '',
    avatar_url: ''
  });

  @ViewChild('avatarContainer') avatarContainer!: ElementRef<HTMLDivElement>;

  avatars = signal<string[]>([]);

  constructor(private usersApi: UsersApi, private avatarsApi: Avatars){
    effect(() => {
      const user = this.userSignal();
      if (user) {
        this.formModel.set({
          username: user.username,
          avatar_url: user.avatar_url || ''
        });

        // Carica gli avatar
        this.avatarsApi.getAvatars().subscribe(data => this.avatars.set(data));
      }
    });
  }

  updateUsername(value: string) {
    this.formModel.set({ ...this.formModel(), username: value });
  }

  updateAvatarUrl(url: string) {
    this.formModel.set({ ...this.formModel(), avatar_url: url });
  }

  submit(event: Event) {
    event.preventDefault();
    this.updateUser(this.formModel())
  }

  updateUser(body: CreateUserDto) {
    const user = this.userSignal();
    if (!user) return; 

    this.usersApi.updateUser(user.id, body).subscribe({
      next: (updatedUser: User) => {
        this.userUpdated.emit(updatedUser);
        this.closeDialog.emit();
      }
    });
  }

  scrollAvatars(direction: 'left' | 'right') {
    const container = this.avatarContainer.nativeElement;
    const scrollAmount = 80; // pixel da scrollare per click
    if(direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

}
