export interface CreateTaskDto {
   "user_id": number,
   "category_id": number,
   "title": string,
   "description": string,
   "priority": number,
   "due_date": Date,
   "exact_remind_at": null | Date,
   "remind_offset_minutes": null | number,
   "recurrence_rule": null | string,
   "recurrence_interval": null | number,
   "occurrences": null | number
}
