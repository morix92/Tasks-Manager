import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Alert } from './services/alert';

// Se il BE usa success=false con HTTP 200, metti a true per abilitare il controllo “logico”
const CHECK_APP_ERROR = true;

/**
 * Intercetta errori HTTP (4xx/5xx o rete) e, opzionalmente,
 * errori “logici” con HTTP 200 (success:false) e mostra un alert.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {


  const alertService = inject(Alert);  // Inietto il servizio AlertService

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
            errorMessage = 'Richiesta Malformata';
            break;
          case 401:
            errorMessage = 'Non autorizzato. Login richiesto.';
            break;
          case 404:
            errorMessage = 'Risorsa non trovata.';
            break;
          case 500:
            errorMessage = 'Errore interno del server.';
            break;
          default:
            errorMessage = `Errore sconosciuto: ${error.message}`;
        }
      }

      alertService.sendAlert({
        message: errorMessage,
        classAlert: 'error'
      });

      return throwError(() => new Error(errorMessage));  // Rilancia l'errore
    })
  );
 
};