const express = require('express');
const router = express.Router();
const tasksController = require('../controllers/tasks.controller');

router.get('/', tasksController.getAllTasks);
router.get('/:id', tasksController.getTaskById);
router.get('/user/:user_id', tasksController.getTaskByUserId);
router.post('/', tasksController.createTask);
router.put('/:id', tasksController.updateTask);
router.put('/complete/:id', tasksController.completeTask);
router.delete('/:id', tasksController.deleteTask);

module.exports = router;
