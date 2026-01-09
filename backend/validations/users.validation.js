const appError = require('../utils/appError');

exports.validateCreateUser = ({ username , avatar_url }) => {
  if (!username) {
    throw new appError('Username is required', 400);
  }

  if (typeof username !== 'string') {
    throw new appError('Username must be a string', 400);
  }

  if (username.length < 3) {
    throw new appError('Username must be at least 3 characters', 400);
  }

  if (avatar_url && typeof avatar_url !== 'string') {
    throw new appError('Avatar URL must be a string', 400);
  }
};

exports.validateUpdateUser = ({ username, avatar_url }) => {

  if (!username) {
    throw new appError('Username is required', 400);
  }

  if (typeof username !== 'string') {
    throw new appError('Username must be a string', 400);
  }

  if (username.length < 3) {
    throw new appError('Username must be at least 3 characters', 400);
  }

  if (avatar_url && typeof avatar_url !== 'string') {
    throw new appError('Avatar URL must be a string', 400);
  }
};
