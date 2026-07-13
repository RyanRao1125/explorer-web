const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:3000/admin.html?error=unauthorized' }),
  (req, res) => {
    res.redirect('http://localhost:3000/admin.html');
  }
);

router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, username: req.user.username });
  } else {
    res.json({ authenticated: false });
  }
});

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000/admin.html');
  });
});

module.exports = router;