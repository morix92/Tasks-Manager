import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';

export interface Reminder {
  username: string;
  id: number;
  taskId: number;
  title: string;
  remindAt: string;
}

export interface Task {
  username: string;
  id: number;
  taskId: number;
  title: string;
  dueDate: string;
}

@Injectable({
  providedIn: 'root',
})
export class socketService {
  private socket: Socket;
  
  constructor() {
    this.socket = io('http://localhost:3000');

    this.socket.on('reminder', (data: Reminder) => {
      console.log('Notifica ricevuta:', data);
      this.showNotification(`Notifica per il profilo ${data.username}: Attività: ${data.title}`);
    });

    this.socket.on('task', (data: Task) => {
      console.log('Scadenza Task ricevuta:', data);
      this.showNotification(`Task in scadenza nel profilo ${data.username}: Attività: ${data.title}`);
    });
  }

  private showNotification(message: string) {
    alert(`ALT, Task in scadenza: ${message}`);
  }
}


