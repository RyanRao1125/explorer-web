require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve your front-end HTML files (portable path — works on any machine/host)
app.use(express.static(path.join(__dirname, '../explorer-robotics')));
console.log('Serving static from', path.join(__dirname, '../explorer-robotics'));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.PRODUCTION_URL || 'https://your-app-name.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {
  if (profile.username === process.env.ADMIN_GITHUB_USERNAME) {
    return done(null, profile);
  }
  return done(null, false);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const registrationRoutes = require('./routes/registration');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');

app.use('/api/registration', registrationRoutes);
app.use('/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});