export interface Task {
   "id": number,
   "user_id": number,
   "category_id": number,
   "category_name": string,
   "category_color": string,
   "title": string,
   "description": string,
   "priority": number,
   "status": number,
   "due_date": Date,
   "created_at": Date,
   "completed_at": Date,
   "exact_remind_at": Date,
   "recurrence_rule": string,
   "recurrence_interval": number
}