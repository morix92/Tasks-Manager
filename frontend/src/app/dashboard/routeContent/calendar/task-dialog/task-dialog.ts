import { Component, computed, input, signal } from '@angular/core';
import { Task } from '../../../../models/task.model';
import { CommonModule } from '@angular/common';

const PRIORITY_MAP: Record<number, string> =  { 1: 'Alta', 2: 'Media', 3: 'Bassa'};
const STATUS_MAP: Record<number, string> =  { 0: 'Da Fare', 1: 'Completata', 2: 'Scaduta'};

@Component({
  selector: 'app-task-dialog',
  imports: [CommonModule],
  templateUrl: './task-dialog.html',
  styleUrl: './task-dialog.css',
})
export class TaskDialog {

  task = input.required<Task | null>();

  taskView = computed(() => {
    const task = this.task();
    if (!task) return null;

    return {
      ...task,
      priorityLabel: PRIORITY_MAP[task.priority] ?? 'N/A',
      statusLabel: STATUS_MAP[task.status] ?? 'N/A'
    };
  });


}
