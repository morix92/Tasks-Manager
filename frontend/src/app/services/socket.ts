import { computed, Injectable, signal } from '@angular/core';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { invoke } from '@tauri-apps/api/core';
import { Auth } from './auth';

export interface Reminder {
  username: string;
  avatar_url: string;
  id: number;
  taskId: number;
  title: string;
  remindAt: string;
}

export interface Task {
  username: string;
  avatar_url: string;
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

  notified = signal(false);
 
  constructor(private auth: Auth) {
    this.socket = io('http://127.0.0.1:3000', {
      transports: ['websocket'],
    });

    this.socket.on('reminder', (data: Reminder) => {
      console.log('Promemoria ricevuto:', data);
      this.showNotification(`PROFILO: ${data.username}\nPROMEMORIA: ${data.title}`, data.avatar_url);
    });

    this.socket.on('task', (data: Task) => {
      console.log('Scadenza ricevuta:', data);
      this.showNotification(`PROFILO: ${data.username}\nSCADENZA: ${data.title}`, data.avatar_url);
    });
  }
  
  private async showNotification(title: string, avatar_url: string) {

    const isWindows = navigator.userAgent.toLowerCase().includes("windows");

    if (isWindows) {
      await invoke("notify_with_image_winrt", {
        title,
        body: "",
        imagePath: avatar_url
      });
    } else {
      await sendNotification({
        title,
        body: "",
        icon: avatar_url
      });
    }

    await invoke('play_sound', { name: 'notify.wav', volume: 1.0 });
    this.notified.update(v => !v);
  }

}


