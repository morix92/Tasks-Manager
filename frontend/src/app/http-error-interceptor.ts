import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Alert } from './services/alert';

const CHECK_APP_ERROR = true;

export const httpErrorInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {

  const alertService = inject(Alert);  // Inietto il servizio Alert

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Errore client-side
        errorMessage = `Errore: ${error.error.message}`;
      } else {
        // Errore server-side
        switch (error.status) {
          case 400:
            console.log(error.error.error)
            if (error.error.error === 'due_date cannot be in the past') {
              errorMessage = 'La Data di Scadenza non può essere nel passato';
            } else if (error.error.error === "remind_at cannot be after the task due_date") {
              errorMessage = 'La Data della Notifica non può essere successiva rispetto alla Data di Scadenza';
            } else if (error.error.error === "exact_remind_at cannot be after the task due_date") {
              errorMessage = 'La Data della Notifica non può essere successiva rispetto alla Data di Scadenza';
            } else if (error.error.error === "remind_at cannot be in the past") {
              errorMessage = 'La Data della Notifica non può essere nel passato';
            }  else if (error.error.error === "exact_remind_at cannot be in the past") {
              errorMessage = 'La Data della Notifica non può essere nel passato';
            }             
            else {
              errorMessage = 'Richiesta Malformata';
            }
            
            break;
          case 401:
            errorMessage = 'Non autorizzato. Login richiesto.';
            break;
          case 404:
            errorMessage = 'Risorsa non trovata.';
            break
          case 409:
            errorMessage = 'Risorsa già esistente: Verificare il Nome utilizzato.';
            break;
          case 500:
            errorMessage = 'Errore interno del server.';
            break;
          default:
            errorMessage = `Errore sconosciuto: ${error.message}`;
        }
      }
      // Invio Alert
      alertService.sendAlert({
        message: errorMessage,
        classAlert: 'error'
      });

      return throwError(() => new Error(errorMessage));  // Rilancia l'errore
    })
  );
 
};