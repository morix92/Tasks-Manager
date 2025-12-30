const express = require('express');
const router = express.Router();
const remindersController = require('../controllers/reminders.controller');

router.get('/', remindersController.getAllReminders);
router.get('/:id', remindersController.getReminderById);
router.post('/', remindersController.createReminder);
router.put('/:id', remindersController.updateReminder);
router.delete('/:id', remindersController.deleteReminder);

module.exports = router;
