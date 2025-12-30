const asyncHandler = require('../utils/asyncHandler');
const usersService = require('../services/users.service');
const { validateCreateUser, validateUpdateUser } = require('../validations/users.validation');

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await usersService.getAllUsers();
  res.status(200).json(users);
});

exports.getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await usersService.getUserById(id);
  res.status(200).json(user);
});

exports.createUser = asyncHandler(async (req, res) => {
  validateCreateUser(req.body);
  const { username, avatar_url } = req.body;
  const user = await usersService.createUser({ username, avatar_url });
  res.status(201).json(user);
});

exports.updateUser = asyncHandler(async (req, res) => {
  validateUpdateUser(req.body);
  const { id } = req.params;
  const { username, avatar_url } = req.body;

  const user = await usersService.updateUser(id, { username, avatar_url });
  res.status(202).json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await usersService.deleteUser(id);
  res.status(204).send();
});
