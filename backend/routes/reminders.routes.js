const express = require('express');
const router = express.Router();
const remindersController = require('../controllers/reminders.controller');

router.get('/', remindersController.getAllReminders);
router.get('/:id', remindersController.getReminderById);
router.get('/task/:task_id', remindersController.getReminderByTask);
router.get('/user/:user_id', remindersController.getReminderByUserId);
router.post('/', remindersController.createReminder);
router.put('/:id', remindersController.updateReminder);
router.delete('/:id', remindersController.deleteReminder);

module.exports = router;
