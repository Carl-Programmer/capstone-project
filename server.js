const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const session = require('express-session');
const { isAuthenticated, isAdmin } = require('./middleware/auth');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require("./routes/courseRoutes");
const mongoose = require('mongoose');
const helpRoutes = require('./routes/helpRoutes');
const fs = require('fs');




const app = express();

// Load environment variables
dotenv.config();

// Connect to MongoDB
const dbMode = process.env.MONGO_MODE || "local";
const mongoURI =
  dbMode === "atlas"
    ? process.env.MONGO_ATLAS_URI
    : process.env.MONGO_LOCAL_URI;

mongoose.connect(mongoURI)
  .then(() => console.log(`✅ Connected to MongoDB (${dbMode} mode)`))
  .catch((err) => console.error("❌ MongoDB connection error:", err));


// Middleware to parse form and JSON data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧠 Session setup
app.use(
  session({
    secret: process.env.SESSION_SECRET,// 🔒 change this to a random string
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // session lasts 1 hour
      secure: false, // set to true for HTTPS
    },
  })
);

// 🧠 Make session user available in all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// 🟢 Default route
app.get('/', (req, res) => res.redirect('/login'));

// Auth routes (handles login, register, logout)
app.use('/', authRoutes);

// Admin routes
app.use('/', adminRoutes);

app.use('/', userRoutes);

app.use("/courses", courseRoutes);

app.use('/help', helpRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Protected routes
//app.get('/users/dashboard', isAuthenticated, (req, res) => {
 // res.render('users/dashboard', { pageTitle: 'Dashboard', user: req.session.user });
//});

app.get('/admin/dashboard', isAdmin, (req, res) => {
  res.render('admin/dashboard', { pageTitle: 'Admin Dashboard', user: req.session.user });
});

// Regular content pages (optional)
// Ensure certificate generation directory exists
const genDir = path.join(__dirname, "public/uploads/certificates/generated");
if (!fs.existsSync(genDir)) {
  fs.mkdirSync(genDir, { recursive: true });
}


app.get('/users/help', (req, res) => {
  res.render('users/help', { pageTitle: 'Help' });
});

app.get('/users/about', (req, res) => {
  res.render('users/aboutUs', { pageTitle: 'About Us' });
});

app.get('/users/settings', (req, res) => {
  res.render('users/settings', { pageTitle: 'Settings' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
