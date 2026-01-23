import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { faqService } from '../../../services/faq';
import { Faq } from '../../../models/faq.model';
import { Auth } from '../../../services/auth';


@Component({
  selector: 'app-faq',
  imports: [CommonModule, RouterLink, MatIcon],
  templateUrl: './faq.html',
  styleUrl: './faq.css',
})
export class FaqComponent {

  activeIndex: number | null = null;
  allFaqs = signal<Faq[]>([]);
  currentUser = computed(() => this.auth.currentUser());

  toggleFaq(index: number) {
    if (this.activeIndex === index) {
      this.activeIndex = null; // chiude l’accordion se cliccato di nuovo
    } else {
      this.activeIndex = index; // apre l’item cliccato
    }
  }

  constructor(private faqService: faqService, private auth: Auth){}

  ngOnInit() {
    this.faqService.getFaqs().subscribe(faqs => this.allFaqs.set(faqs));
  }
}