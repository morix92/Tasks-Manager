const asyncHandler = require('../utils/asyncHandler');
const tasksService = require('../services/tasks.service');
const {
  validateCreateTask,
  validateUpdateTask,

} = require('../validations/tasks.validation');


exports.getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await tasksService.getAllTasks(req.query);
  res.status(200).json(tasks);
});

exports.getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await tasksService.getTaskById(id);
  res.status(200).json(task);
});

exports.getTaskByUserId = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const { status } = req.query;
  const tasks = await tasksService.getTaskByUserId(
    user_id,
    status !== undefined ? Number(status) : null
  );
  res.status(200).json(tasks);
});

exports.createTask = asyncHandler(async (req, res) => {
  validateCreateTask(req.body);
  const result = await tasksService.createTask(req.body);
  res.status(201).json(result);
});

exports.updateTask = asyncHandler(async (req, res) => {
  validateUpdateTask(req.body);
  const { id } = req.params;
  const task = await tasksService.updateTask(id, req.body);
  res.status(200).json(task);
});

exports.completeTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const task = await tasksService.completeTask(id);
  res.status(200).json(task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await tasksService.deleteTask(id);
  res.status(204).send();
});

/* -----------------------------------------------------------
 * (Opzionale) Endpoint per cancellare una serie intera
 * ----------------------------------------------------------- */
// exports.deleteTaskSeries = asyncHandler(async (req, res) => {
//   const { series_id } = req.params;
//   const result = await tasksService.deleteTaskSeries(series_id);
//   res.status(200).json(result);
// });