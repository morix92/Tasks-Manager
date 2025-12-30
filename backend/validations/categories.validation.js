const appError = require('../utils/appError');

exports.validateCreateCategory = ({ name, color }) => {
  if (!name) {
    throw new appError('Name is required', 400);
  }

  if (typeof name !== 'string') {
    throw new appError('Name must be a string', 400);
  }

  if (name.length < 3) {
    throw new appError('Name must be at least 3 characters', 400);
  }

  if (color && typeof color !== 'string') {
    throw new appError('Color must be a string', 400);
  }
};

exports.validateUpdateCategory = ({ name, color }) => {
  if (name && typeof color !== 'string') {
    throw new appError('Name must be a string', 400);
  }

  if (name && name.length < 3) {
    throw new appError('Name must be at least 3 characters', 400);
  }

  if (color && typeof color !== 'string') {
    throw new appError('Color must be a string', 400);
  }
};
