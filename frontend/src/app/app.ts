import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './dashboard/navbar/navbar';
import { Footer } from './dashboard/footer/footer';
import { Sidebar } from './dashboard/sidebar/sidebar';
import { Auth } from './services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Sidebar, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');

  constructor(private auth : Auth){}

  isLoggedIn = computed(() => this.auth.isLoggedIn());

}
