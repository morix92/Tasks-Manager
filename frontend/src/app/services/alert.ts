import { Injectable, signal } from '@angular/core';

export interface AlertData {
  message: string;
  classAlert: string;
}

@Injectable({
  providedIn: 'root',
})
export class Alert {

  constructor() { }

  private _alert = signal<AlertData | null >(null);

  readonly alert = this._alert.asReadonly();

  sendAlert(alertData: AlertData, timeout = 4000) {
    this._alert.set(alertData);

    setTimeout(() => {
      this._alert.set(null);
    }, timeout);
  }
  
}
