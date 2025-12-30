const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories.controller');

router.get('/', categoriesController.getAllCategories);
router.get('/name/:name', categoriesController.getCategoryByName);
router.get('/:id', categoriesController.getCategoryById);

router.post('/', categoriesController.createCategory);
router.put('/:id', categoriesController.updateCategory);
router.delete('/:id', categoriesController.deleteCategory);

module.exports = router;
