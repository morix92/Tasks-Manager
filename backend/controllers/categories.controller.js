const asyncHandler = require('../utils/asyncHandler');
const categoriesService = require('../services/categories.service');
const { validateCreateCategory, validateUpdateCategory } = require('../validations/categories.validation');


exports.getAllCategories = asyncHandler(async (req, res) => {
  const categories = await categoriesService.getAllCategories();
  res.status(200).json(categories);
});

exports.getCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await categoriesService.getCategoryById(id);
  res.status(200).json(category);
});

exports.getCategoryByName = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const category = await categoriesService.getCategoryByName(name);
  res.status(200).json(category);
});

exports.createCategory = asyncHandler(async (req, res) => {
  validateCreateCategory(req.body);
  const { name, color } = req.body;
  const category = await categoriesService.createCategory({ name, color });
  res.status(201).json(category);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  validateUpdateCategory(req.body);
  const { id } = req.params;
  const { name, color } = req.body;

  const category = await categoriesService.updateCategory(id, { name, color });
  res.status(202).json(category);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await categoriesService.deleteCategory(id);
  res.status(204).send();
});
