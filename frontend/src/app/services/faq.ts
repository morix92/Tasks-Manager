import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Faq } from '../models/faq.model';

@Injectable({
  providedIn: 'root',
})
export class faqService {

  constructor(private http : HttpClient){}

  getFaqs(): Observable<Faq[]> {
    return this.http.get<Faq[]>('assets/faq/faq.it.json');
  }


}
