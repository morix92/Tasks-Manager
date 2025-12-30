const appError = require('../utils/appError');

const VALID_STATUS = ['da_eseguire', 'in_corso', 'eseguita'];
const VALID_RECURRENCE_RULES = ['hourly', 'daily', 'weekly', 'monthly', 'yearly'];

exports.validateCreateTask = ({ user_id, title, due_date, priority, status, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order }) => {
  if (!user_id) throw new appError('user_id is required', 400);

  if (!title) throw new appError('title is required', 400);

  if (typeof title !== 'string') throw new appError('title must be a string', 400);

  if (!due_date) throw new appError('due_date is required', 400);

  if (isNaN(Date.parse(due_date))) throw new appError('due_date must be a valid date', 400);

  if (status && !VALID_STATUS.includes(status)) throw new appError('invalid status value', 400);

  if (priority !== undefined && (priority < 1 || priority > 3)) throw new appError('priority must be between 1 and 3', 400);

  if (exact_remind_at && recurrence_rule) throw new appError('Cannot use exact_remind_at together with recurrence_rule', 400);

  if (exact_remind_at && recurrence_interval) throw new appError('Cannot use exact_remind_at together with recurrence_interval', 400);

  if (exact_remind_at && !recurrence_rule && !recurrence_interval) {
    const date = new Date(exact_remind_at);
    if (isNaN(date.getTime())) throw new appError('exact_remind_at must be a valid date', 400);
  }

  if (recurrence_rule && !VALID_RECURRENCE_RULES.includes(recurrence_rule)) {
    throw new appError('recurrence_rule must be valid', 400);
  }

  if (recurrence_rule && (!recurrence_interval || recurrence_interval < 1)) {
    throw new appError('recurrence_interval must be >= 1 if recurrence_rule is set', 400);
  }

  if (!recurrence_rule && recurrence_interval) {
    throw new appError('recurrence_rule is required if recurrence_interval is set', 400);
  }

  if (is_featured === true && (featured_order < 1 || featured_order > 3)) {
    throw new appError('featured_order must be between 1 and 3 when is_featured is true', 400);
  }

  if (is_featured === false && featured_order != null) {
    throw new appError('featured_order must be null when is_featured is false', 400);
  }
};

exports.validateUpdateTask = ({ title, due_date, priority, status, exact_remind_at, recurrence_rule, recurrence_interval, is_featured, featured_order }) => {

  if (title && typeof title !== 'string') throw new appError('title must be a string', 400);

  if (due_date && isNaN(Date.parse(due_date))) throw new appError('due_date must be a valid date', 400);

  if (status && !VALID_STATUS.includes(status)) throw new appError('invalid status value', 400);

  if (priority !== undefined && (priority < 1 || priority > 3)) throw new appError('priority must be between 1 and 3', 400);

  if (exact_remind_at && recurrence_rule) throw new appError('Cannot use exact_remind_at together with recurrence_rule', 400);

  if (exact_remind_at && recurrence_interval) throw new appError('Cannot use exact_remind_at together with recurrence_interval', 400);

  if (exact_remind_at) {
    const date = new Date(exact_remind_at);
    if (isNaN(date.getTime())) throw new appError('exact_remind_at must be a valid date', 400);
  }

  if (recurrence_rule && !VALID_RECURRENCE_RULES.includes(recurrence_rule)) {
    throw new appError('recurrence_rule must be valid', 400);
  }

  if (recurrence_rule && (!recurrence_interval || recurrence_interval < 1)) {
    throw new appError('recurrence_interval must be >= 1 if recurrence_rule is set', 400);
  }

  if (!recurrence_rule && recurrence_interval) {
    throw new appError('recurrence_rule is required if recurrence_interval is set', 400);
  }

  if (is_featured === true && (featured_order < 1 || featured_order > 3)) {
    throw new appError('featured_order must be between 1 and 3 when is_featured is true', 400);
  }

  if (is_featured === false && featured_order != null) {
    throw new appError('featured_order must be null when is_featured is false', 400);
  }
};
