import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from './services/auth';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(Auth);
  const router = inject(Router);

  const isLoggedIn = authService.isLoggedIn();

  if(isLoggedIn) {
    if (state.url === '/profiles') {
      return router.createUrlTree(['/home'])
    }
    return true;
  } else {
    return state.url === '/profiles' ? true : router.createUrlTree(['/profiles'])
  }
};
