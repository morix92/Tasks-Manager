import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './dashboard/navbar/navbar';
import { Footer } from './dashboard/footer/footer';
import { Sidebar } from './dashboard/sidebar/sidebar';
import { Auth } from './services/auth';
import { CommonModule } from '@angular/common';
import { socketService } from './services/socket';
import { Alert } from './services/alert';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private auth : Auth, private socketService: socketService, private alertService: Alert){}

  isLoggedIn = computed(() => this.auth.isLoggedIn());
  alert = computed(() => this.alertService.alert());

}
