import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { open } from "@tauri-apps/plugin-shell";

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {

  copied = signal<boolean>(false);

  async copyLink(event?: MouseEvent) {
    if (event) event.preventDefault();

    const url = "https://morix92.github.io/Portfolio/";

    try {
      await navigator.clipboard.writeText(url);
      this.copied.set(true);

      setTimeout(() => {
        this.copied.set(false);
      }, 1500);
    } catch (err) {
      console.error("Errore durante la copia del link:", err);
    }
  }

}
