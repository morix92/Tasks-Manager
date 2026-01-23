import { Injectable, signal } from '@angular/core';


@Injectable({ providedIn: 'root' })
export class FilterService {

  private _showOrdering = signal(false);

  private _title = signal('');
  private _priorityId = signal<number | null>(null);
  private _categoryName = signal('');
  private _dueDate = signal<Date | null>(null);
  private _remindAt = signal<Date | null>(null);

  private _orderBy = signal<'priority' | 'dueDate' | 'remindAt'>('dueDate');
  private _orderDirection = signal<'asc' | 'desc'>('asc');

  readonly title = this._title.asReadonly();
  readonly priorityId = this._priorityId.asReadonly();
  readonly categoryName = this._categoryName.asReadonly();
  readonly dueDate = this._dueDate.asReadonly();
  readonly remindAt = this._remindAt.asReadonly();
  readonly orderBy = this._orderBy.asReadonly();
  readonly orderDirection = this._orderDirection.asReadonly();
  readonly showOrdering = this._showOrdering.asReadonly();

  setShowOrdering(value: boolean) { this._showOrdering.set(value); }

  setTitle(value: string) {
    this._title.set(value);
  }

  setPriority(id: number | null) {
    this._priorityId.set(id);
  }

  setCategory(color: string) {
    this._categoryName.set(color);
  }

  setDueDate(date: Date | null) {
    this._dueDate.set(date);
  }

  setRemindAt(date: Date | null) {
    this._remindAt.set(date);
  }

  setOrder(by: 'priority' | 'dueDate' | 'remindAt', direction: 'asc' | 'desc' = 'asc') {
    this._orderBy.set(by);
    this._orderDirection.set(direction);
  }

  reset() {
    this._title.set('');
    this._priorityId.set(null);
    this._categoryName.set('');
    this._dueDate.set(null);
    this._remindAt.set(null);
    this._orderBy.set('dueDate');
    this._orderDirection.set('asc');
  }

  toggleOrder(by: 'priority' | 'dueDate' | 'remindAt') {
    if (this._orderBy() === by) {
      this._orderDirection.set(this._orderDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this._orderBy.set(by);
      this._orderDirection.set('asc');
    }
  }
}
