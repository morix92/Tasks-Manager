import { Component, computed, ElementRef, EventEmitter, Output, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateUserDto } from '../../../models/createUser.model';
import { UsersApi } from '../../../services/crud/users/users-api';
import { User } from '../../../models/user.model';
import { Avatars } from '../../../services/avatars';

@Component({
  selector: 'app-add-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './add-profile.html',
  styleUrls: ['./add-profile.css'],
})
export class AddProfile {

  @Output() userCreated = new EventEmitter<User>();
  @Output() closeDialog = new EventEmitter<void>();

  @ViewChild('avatarContainer') avatarContainer!: ElementRef<HTMLDivElement>;

  constructor(private usersApi: UsersApi, private avatarsApi: Avatars){}

  avatars = signal<string[]>([]);
  isSubmitted = signal(false);

  ngOnInit() {
    this.avatarsApi.getAvatars().subscribe(data => {
       this.avatars.set(data);
    });
  }
  
  formModel = signal<CreateUserDto>({
    username: '',
    avatar_url: ''
  });
  
  formErrors = computed(() => {
    const f = this.formModel();
    const errors: Record<string, string> = {};

    if (!f.username) {
      errors['username'] = 'Il campo Nome è obbligatorio';
    } else if (f.username.trim().length < 3) {
      errors['username'] = 'Il campo Nome deve contenere almeno 3 caratteri';
    }
    if (!f.avatar_url) errors['avatar_url'] = 'Selezionare un Avatar';
    return errors;
  });

  isValidForm = computed(() => Object.keys(this.formErrors()).length === 0);
  
  updateUsername(value: string) {
    this.formModel.set({ ...this.formModel(), username: value });
  }

  updateAvatarUrl(url: string) {
    this.formModel.set({ ...this.formModel(), avatar_url: url });
  }

  submit(event: Event) {
    event.preventDefault();
    this.isSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.createUser(this.formModel());
  }

  createUser(body: CreateUserDto) {
  this.usersApi.createUser(body).subscribe({
    next: (user: User) => {
      this.userCreated.emit(user);
      this.closeDialog.emit();
    },
    error: (err) => {
      console.error(err);
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
