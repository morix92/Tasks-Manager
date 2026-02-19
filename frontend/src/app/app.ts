import { Component, computed, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Navbar } from './dashboard/navbar/navbar';
import { Footer } from './dashboard/footer/footer';
import { Sidebar } from './dashboard/sidebar/sidebar';
import { Auth } from './services/auth';
import { CommonModule } from '@angular/common';
import { socketService } from './services/socket';
import { Alert } from './services/alert';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { Splash } from './dashboard/splash/splash';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Sidebar, CommonModule, Splash],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
  protected readonly loading = signal(true);

  constructor(private router: Router, private auth : Auth, private socketService: socketService, private alertService: Alert){}

  isLoggedIn = computed(() => this.auth.isLoggedIn());
  alert = computed(() => this.alertService.alert());


  async ngOnInit(): Promise<void> {

    await this.waitBackendAndGo();
  }

  private async waitBackendAndGo(): Promise<void> {
    await new Promise(r => setTimeout(r, 150));

    while (true) {
      try {
        const res = await fetch('http://127.0.0.1:3000/health', { cache: 'no-store' });
        if (res.ok) break;
      } catch (e) {}

      await new Promise(r => setTimeout(r, 300));
    }

    (window as any).__BACKEND_READY__ = true;
    this.loading.set(false);

  }

}
