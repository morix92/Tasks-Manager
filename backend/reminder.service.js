function generateReminders(dueDate, rule, interval = 1) {
  const reminders = [];
  let date = new Date(dueDate);
  const now = new Date();

  while (date > now) {
    reminders.push(new Date(date));
    switch (rule) {
      case 'hourly':
        date.setHours(date.getHours() - interval);
        break;
      case 'daily':
        date.setDate(date.getDate() - interval);
        break;
      case 'weekly':
        date.setDate(date.getDate() - interval * 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() - interval);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() - interval);
        break;
      default:
        throw new Error(`Unsupported rule: ${rule}`);
    }
  }

  // Check reminder già passati
  return reminders.filter(d => d > now);
}

module.exports = {
  generateReminders
};

