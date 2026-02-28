import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Task } from '../../../models/task.model';
import { TasksApi } from '../../../services/crud/tasks/tasks-api';
import { Auth } from '../../../services/auth';
import { MatIcon } from '@angular/material/icon';
import { RemindersApi } from '../../../services/crud/reminders/reminders-api';
import { Reminder } from '../../../models/reminder.model';
import { AddReminder } from '../reminders/add-reminder/add-reminder';
import { catchError, forkJoin, of } from 'rxjs';
import { RemindersFromTask } from '../reminders/reminders-from-task/reminders-from-task';
import { EditTask } from './edit-task/edit-task';
import { ReopenTask } from './reopen-task/reopen-task';
import { FilterService } from '../../../services/filter-service';
import { Alert } from '../../../services/alert';
import { socketService } from '../../../services/socket';
import { Paginator } from '../../paginator/paginator';

type Tab = 'daFare' | 'completati' | 'scaduti';
type ActiveDialog = 'addReminder' | 'viewReminders' | 'editTask' | 'reopenTask' | null;

@Component({
  selector: 'app-tasks',
  imports: [MatTabsModule, CommonModule, MatIcon, AddReminder, EditTask, RemindersFromTask, ReopenTask, Paginator],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {

  page = signal(1);
  pageSize = signal(6);

  activeDialog = signal<ActiveDialog>(null);
  activeTab = signal<Tab>('daFare');
  currentUser = computed(() => this.auth.currentUser());
  allTasks = signal<Task[]>([]);
  nextReminderMap = signal<Record<number, Reminder | null>>({});
  priorities = signal([{id: 1, value: 'Alta' },{id: 2, value: 'Media'},{id: 3, value: 'Bassa'}]);
  selectedTaskId = signal<number | null>(null);
  selectedTask = computed(() =>
    this.allTasks().find(t => t.id === this.selectedTaskId()) ?? null
  );
  animationType: 'remove' | 'complete' | null = null;
  animatedTaskId: number | null = null;
  private readonly ANIMATION_TIME = 600;
  notified = computed(() => this.socketService.notified());

  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  statusByTabIndex = computed(() => {
    switch (this.activeTab()) {
      case 'daFare':
        return 0;
      case 'completati':
        return 1;
      case 'scaduti':
        return 2;
    }
  });

  tasksWithPriority = computed(() => 
    this.allTasks().map(task => ({
      ...task,
      priorityLabel: this.priorities().find(p => p.id === task.priority)?.value ?? 'N/A'
    }))
  );

  filteredTasks = computed(() => {
    const tasks = this.tasksWithPriority();
    const title = this.filters.title().toLowerCase();
    const priorityId = this.filters.priorityId();
    const categoryName = this.filters.categoryName();
    const dueDate = this.filters.dueDate();

    return tasks.filter(task => {

      const matchesTitle =
        !title || task.title?.toLowerCase().includes(title);

      const matchesPriority =
        priorityId === null || task.priority === priorityId;

      const matchesCategory =
        !categoryName || task.category_name?.toLowerCase().includes(categoryName);;

      const matchesDueDate =
        !dueDate || this.isSameDate(task.due_date, dueDate);

      return matchesTitle && matchesPriority && matchesCategory && matchesDueDate;
    });
  });
  
  private isSameDate(d1: Date | string, d2: Date): boolean {
    const date1 = new Date(d1);
    const date2 = new Date(d2);

    date1.setHours(0,0,0,0);
    date2.setHours(0,0,0,0);

    return date1.getTime() === date2.getTime();
  }

  filteredAndSortedTasks = computed(() => {
    const tasks = [...this.filteredTasks()];

    const orderBy = this.filters.orderBy();
    const direction = this.filters.orderDirection();

    if (!orderBy) return tasks;

    return tasks.sort((a, b) => {
      let compare = 0;

      if (orderBy === 'priority') {
        compare = (a.priority ?? 0) - (b.priority ?? 0);
      }

      if (orderBy === 'dueDate') {
        compare =
          new Date(a.due_date).getTime() -
          new Date(b.due_date).getTime();
      }

      return direction === 'asc' ? compare : -compare;
    });
  });

  trackById = (_: number, task: Task) => task.id;

  totalItems = computed(() => this.filteredAndSortedTasks().length);

  paginatedTasks = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredAndSortedTasks().slice(start, end);
  });


  constructor(private tasksApi: TasksApi, private auth: Auth, private remindersApi: RemindersApi, private filters: FilterService, private alertService: Alert, private socketService: socketService){
    this.filters.setShowOrdering(true);
    effect(() => {
      const user = this.currentUser();
      const tab = this.statusByTabIndex();
      const _trigger = this.socketService.notified();

      if (!user?.id) return;

      this.tasksApi.getTasksByUserId(user.id, tab).pipe(catchError(() => of([]))).subscribe(tasks => {
          this.allTasks.set(tasks);
      });
    });

    effect(() => {
      const tasks = this.allTasks();

      if (!tasks.length) {
        this.nextReminderMap.set({});
        return;
      }

      const requests = tasks.map(task =>
        this.remindersApi.getReminderByTask(task.id, 0).pipe(
          catchError(err =>
            err.status === 404 ? of(null) : of(null)
          ),
        )
      );

      forkJoin(requests).subscribe(reminders => {
        const map: Record<number, Reminder | null> = {};
        reminders.forEach((reminder, index) => {
          map[tasks[index].id] = reminder?.[0] ?? null;
        });
        this.nextReminderMap.set(map);
      });
    });
    effect(() => {
      this.filteredAndSortedTasks();
      this.page.set(1);
    });

  }
  
  onReminderCreated(reminder: Reminder) {
    const taskId = reminder.task_id;

    this.remindersApi.getReminderByTask(taskId, 0).subscribe({
      next: next => {
        const firstReminder = next?.[0] ?? null;
        this.nextReminderMap.update(map => ({
          ...map,
          [taskId]: firstReminder
        }));
      },
      error: err => {
        if (err.status === 404) {
          this.nextReminderMap.update(map => ({
            ...map,
            [taskId]: null
          }));
        }
      }
    });
  }

  onReminderDeleted(taskId: number) {
    this.remindersApi.getReminderByTask(taskId, 0).subscribe({
      next: next => {
        const firstReminder = next?.[0] ?? null;
        this.nextReminderMap.update(map => ({
          ...map,
          [taskId]: firstReminder
        }));
      },
      error: err => {
        if (err.status === 404) {
          this.nextReminderMap.update(map => ({
            ...map,
            [taskId]: null
          }));
        }
      }
    });
  }

  onTaskUpdate(task: Task) {
    const updatedTasks = this.allTasks().map(r => r.id === task.id ? task : r);
    this.allTasks.set(updatedTasks);
    this.activeDialog.set(null);
  }

  onTaskCreated(task: Task) {
    this.setTab('daFare');
    this.allTasks.set([...this.allTasks(), task]);
    this.activeDialog.set(null);
  }

  addReminder(id: number){
    this.selectedTaskId.set(id);
    this.activeDialog.set('addReminder');
  }

  viewReminders(id: number){
    this.selectedTaskId.set(id);
    this.activeDialog.set('viewReminders');
  }

  editTask(id: number){
    this.selectedTaskId.set(id);
    this.activeDialog.set('editTask');
  }

  deleteTask(id: number) {
    this.animateTaskAndExecute(id, 'remove', () => {
      this.tasksApi.deleteTask(id).subscribe(() => {
        this.allTasks.set(this.allTasks().filter(t => t.id !== id));
        this.alertService.sendAlert({
          message: `Attività eliminata con successo`,
          classAlert: 'success'
        });
      });
    });
  }

  riapriTask(id:number){
    this.selectedTaskId.set(id);
    this.activeDialog.set('reopenTask');
  }

  completaTask(id: number) {
    this.animateTaskAndExecute(id, 'complete', () => {
      this.tasksApi.completeTask(id).subscribe(() => {
        this.allTasks.set(this.allTasks().filter(t => t.id !== id));
        this.alertService.sendAlert({
          message: `Attività Completata con successo`,
          classAlert: 'success'
        });
      });
    });
  }

  closeDialog(){
    this.activeDialog.set(null);
  }

  animateTaskAndExecute(taskId: number, type: 'remove' | 'complete', action: () => void) {
    this.animatedTaskId = taskId;
    this.animationType = type;

    setTimeout(() => {
      action();
      this.animatedTaskId = null;
      this.animationType = null;
    }, this.ANIMATION_TIME);
  }

}

