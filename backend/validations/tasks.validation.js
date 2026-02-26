// validations/tasks.validation.js
const appError = require('../utils/appError');

const VALID_RECURRENCE_RULES = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];

exports.validateCreateTask = (body) => {
  const {
    user_id,
    title,
    due_date,
    priority,
    exact_remind_at,
    remind_offset_minutes,
    recurrence_rule,
    recurrence_interval,
    occurrences
  } = body;

  /* -------------------- REQUIRED -------------------- */
  if (!user_id) throw new appError('user_id is required', 400);

  if (!title) throw new appError('title is required', 400);
  if (typeof title !== 'string') throw new appError('title must be a string', 400);
  if (title.length > 40) throw new appError('taskTitle cannot be more than 40 characters', 400);
  if (!due_date) throw new appError('due_date is required', 400);

  const dueDateObj = new Date(due_date);
  const now = new Date();

  if (isNaN(dueDateObj.getTime())) throw new appError('due_date must be a valid date', 400);
  if (dueDateObj.getTime() < now.getTime()) {
    throw new appError('due_date cannot be in the past', 400);
  }

  /* -------------------- OPTIONAL -------------------- */
  if (priority !== undefined && priority !== null) {
    if (typeof priority !== 'number' || priority < 1 || priority > 3) {
      throw new appError('priority must be between 1 and 3', 400);
    }
  }

  /* -------------------- REMINDER -------------------- */
  // Se sono entrambi null/undefined: nessun reminder (OK)
  // Se sono entrambi valorizzati: errore
  const hasExact = exact_remind_at !== undefined && exact_remind_at !== null;
  const hasOffset = remind_offset_minutes !== undefined && remind_offset_minutes !== null;

  if (hasExact && hasOffset) {
    throw new appError('Use exact_remind_at OR remind_offset_minutes, not both', 400);
  }

  if (hasExact) {
    const exactDate = new Date(exact_remind_at);
    if (isNaN(exactDate.getTime())) throw new appError('exact_remind_at must be a valid date', 400);
    if (exactDate.getTime() > dueDateObj.getTime()) {
      throw new appError('exact_remind_at cannot be after due_date', 400);
    }
    if (exactDate.getTime() < now.getTime()) {
      throw new appError('exact_remind_at cannot be in the past', 400);
    }
  }

  if (hasOffset) {
    if (typeof remind_offset_minutes !== 'number' || remind_offset_minutes < 0) {
      throw new appError('remind_offset_minutes must be a positive number', 400);
    }
  }

  /* -------------------- RECURRENCE -------------------- */
  if (recurrence_rule !== undefined && recurrence_rule !== null) {
    if (!VALID_RECURRENCE_RULES.includes(recurrence_rule)) {
      throw new appError('recurrence_rule must be valid', 400);
    }

    if (recurrence_interval === undefined || recurrence_interval === null || recurrence_interval < 1) {
      throw new appError('recurrence_interval must be >= 1 when recurrence_rule is set', 400);
    }

    if (occurrences === undefined || occurrences === null || occurrences < 1) {
      throw new appError('occurrences must be >= 1 when recurrence_rule is set', 400);
    }
  }
};

exports.validateUpdateTask = ({ title, priority }) => {
  if (title !== undefined && title !== null && typeof title !== 'string') {
    throw new appError('title must be a string', 400);
  }

  if (title.length > 40) throw new appError('taskTitle cannot be more than 40 characters', 400);

  if (priority !== undefined && priority !== null) {
    if (typeof priority !== 'number' || priority < 1 || priority > 3) {
      throw new appError('priority must be between 1 and 3', 400);
    }
  }
};