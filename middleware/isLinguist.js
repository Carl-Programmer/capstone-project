module.exports.isLinguist = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  if (req.session.user.role !== 'linguist') {
    return res.status(403).send('Linguist access only');
  }

  next();
};
