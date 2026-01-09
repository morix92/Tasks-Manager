import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

export interface AuthState {
  loggedIn: boolean;
  user: User | null;
}

@Injectable({ providedIn: 'root' })
export class Auth {
  private _state = signal<AuthState>({
    loggedIn: false,
    user: null
  });

  state = this._state.asReadonly();

  isLoggedIn = computed(() => this.state().loggedIn);
  currentUser = computed(() => this.state().user);

  login(user: User) {
    this._state.set({
      loggedIn: true,
      user
    });
  }

  logout() {
    this._state.set({
      loggedIn: false,
      user: null
    });
  }
}
