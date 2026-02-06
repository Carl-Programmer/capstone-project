// middleware/auth.js

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Access denied. Admins only.');
}

// ✅ ADD THIS
function isAdminOrLinguist(req, res, next) {
  if (
    req.session?.user &&
    (req.session.user.role === 'admin' || req.session.user.role === 'linguist')
  ) {
    return next();
  }
  return res.status(403).send("Access denied");
}


module.exports = {
  isAuthenticated,
  isAdmin,
  isAdminOrLinguist // 👈 export it
};
