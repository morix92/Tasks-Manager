const asyncHandler = require('../utils/asyncHandler');
const remindersService = require('../services/reminders.service');
const { validateCreateReminder, validateUpdateReminder } = require('../validations/reminders.validation');

exports.getAllReminders = asyncHandler(async (req, res) => {
  const reminders = await remindersService.getAllReminders(req.query);
  res.status(200).json(reminders);
});

exports.getReminderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reminder = await remindersService.getReminderById(id);
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
