import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-faq',
  imports: [CommonModule, RouterLink, MatIcon],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class Faq {

  activeIndex: number | null = null;

  faqs = [
    { question: 'Come posso creare un task?', answer: 'La risposta qui. Puoi spiegare passo passo come creare un task.' },
    { question: 'Posso modificare un task già creato?', answer: 'Sì, clicca sul task e poi su “Modifica”.' },
    { question: 'Come eliminare un task completato?', answer: 'Clicca sull’icona del cestino accanto al task completato. Conferma per eliminare.' },
  ];

  toggleFaq(index: number) {
    if (this.activeIndex === index) {
      this.activeIndex = null; // chiude l’accordion se cliccato di nuovo
    } else {
      this.activeIndex = index; // apre l’item cliccato
    }
  }
}