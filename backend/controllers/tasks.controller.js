const asyncHandler = require('../utils/asyncHandler');
const tasksService = require('../services/tasks.service');
const { validateCreateTask, validateUpdateTask } = require('../validations/tasks.validation');

exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await tasksService.getAllTasks(req.query);
  res.status(200).json(tasks);
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await tasksService.getTaskById(id);
  res.status(200).json(task);
});

exports.createTask = asyncHandler(async (req, res) => {
  validateCreateTask(req.body);
  const task = await tasksService.createTask(req.body);
  res.status(201).json(task);
});

exports.updateTask = asyncHandler(async (req, res) => {
  validateUpdateTask(req.body);
  const { id } = req.params;
  const task = await tasksService.updateTask(id, req.body);
  res.status(200).json(task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await tasksService.deleteTask(id);
  res.status(204).send();
});
