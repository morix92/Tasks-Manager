const appError = require('../utils/appError');

exports.validateCreateReminder = ({ task_id, remind_at }) => {
  if (!task_id) {
    throw new appError('task_id is required', 400);
  }

  if (typeof task_id !== 'number') {
    throw new appError('task_id must be a number', 400);
  }

  if (!remind_at) {
    throw new appError('remind_at is required', 400);
  }

  const remindAtDate = new Date(remind_at);
  if (isNaN(remindAtDate.getTime())) {
    throw new appError('remind_at must be a valid date', 400);
  }

  const now = new Date();
  if (remindAtDate < now) {
    throw new appError('remind_at cannot be in the past', 400);
  }
};

exports.validateUpdateReminder = ({ remind_at }) => {
  if (!remind_at) {
    throw new appError('remind_at is required', 400);
  }

  const remindAtDate = new Date(remind_at);
  if (isNaN(remindAtDate.getTime())) {
    throw new appError('remind_at must be a valid date', 400);
  }

  const now = new Date();
  if (remindAtDate < now) {
    throw new appError('remind_at cannot be in the past', 400);
  }
};
