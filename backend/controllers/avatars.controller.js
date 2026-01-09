const fs = require('fs');
const path = require('path');

exports.getAvatars = (req, res) => {
  const avatarDir = path.join(__dirname, '../public/avatar');

  fs.readdir(avatarDir, (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Errore lettura avatar' });
    }

    const avatars = files
      .filter(file => /\.(png|jpg|jpeg|webp)$/i.test(file))
      .map(file => `/avatar/${file}`);

    res.json(avatars);
  });
};
