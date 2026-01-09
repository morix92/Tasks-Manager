const express = require('express');
const router = express.Router();
const { getAvatars } = require('../controllers/avatars.controller');

router.get('/', getAvatars);

module.exports = router;
