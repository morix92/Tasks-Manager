const asyncHandler = require('../utils/asyncHandler');
const remindersService = require('../services/reminders.service');
const { validateCreateReminder, validateUpdateReminder } = require('../validations/reminders.validation');

exports.getAllReminders = asyncHandler(async (req, res) => {
  const reminders = await remindersService.getAllReminders(req.query);
  res.status(200).json(reminders);
});

exports.getReminderByUserId = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const { is_sent } = req.query;
  const reminder = await remindersService.getReminderByUserId(
    user_id,
    is_sent !== undefined ? Number(is_sent) : null,
  );
  res.status(200).json(reminder);
});

exports.getReminderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reminder = await remindersService.getReminderById(id);
  res.status(200).json(reminder);
});

exports.getReminderByTask = asyncHandler(async (req, res) => {
  const { task_id } = req.params;
  const { limit } = req.query;
  const reminder = await remindersService.getReminderByTask(task_id, limit !== undefined ? limit === 'true' : false);
  res.status(200).json(reminder);
});

exports.createReminder = asyncHandler(async (req, res) => {
  validateCreateReminder(req.body);
  const reminder = await remindersService.createReminder(req.body);
  res.status(201).json(reminder);
});

exports.updateReminder = asyncHandler(async (req, res) => {
  validateUpdateReminder(req.body);
  const { id } = req.params;
  const reminder = await remindersService.updateReminder(id, req.body);
  res.status(202).json(reminder);
});

exports.deleteReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await remindersService.deleteReminder(id);
  res.status(204).send();
});
