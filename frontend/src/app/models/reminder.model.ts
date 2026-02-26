export interface Reminder {
   id: number;
   user_id: number;
   task_id: number,
   task_title: string,
   task_due_date: Date,
   remind_at: Date,
   is_sent: number
}