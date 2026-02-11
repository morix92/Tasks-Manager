const fs = require('fs');
const path = require('path');
const BASE_URL = process.env.API_BASE_URL || 'http://127.0.0.1:3000';

exports.getAvatars = (req, res) => {
  if (!process.env.TASK_MANAGER_DATA_DIR) {
    return res.status(500).json({ message: 'TASK_MANAGER_DATA_DIR non definita' });
  }
  const avatarDir = path.join(process.env.TASK_MANAGER_DATA_DIR, 'avatar');

  fs.readdir(avatarDir, (err, files) => {
    if (err) {
      console.error('Errore lettura avatar:', err);
      return res.status(500).json({ message: 'Errore lettura avatar' });
    }

    const avatars = files
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => `${BASE_URL}/avatar/${file}`);

    res.json(avatars);
  });
};
