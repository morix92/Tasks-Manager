import { Component, computed } from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import { Auth } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [MatIconModule , CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  constructor(private auth: Auth, private router: Router){}

  currentUser = computed(() => this.auth.currentUser());

  logout(){
    this.auth.logout();
    this.router.navigate(['/profiles'])
  }
}
