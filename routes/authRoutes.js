const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const crypto = require("crypto");
const transporter = require("../config/mailer");
const bcrypt = require('bcryptjs');
const session = require('express-session');



// ============================
// REGISTER 
// ============================

// GET register form
router.get('/register', (req, res) => {
  res.render('register', {
    error: req.query.error,
    success: req.query.success
  });
});

// POST register form
router.post('/register', async (req, res) => {
  console.log('📩 Received registration form:', req.body);

  const { givenName, surname, gender, dateOfBirth, username, email, password } = req.body;

  try {
    // 1️⃣ Check if username or email already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {

      // If verified user exists → block
      if (existingUser.isVerified) {
        let errorMsg = existingUser.username === username
          ? 'Username already exists'
          : 'Email already exists';

        return res.redirect(`/register?error=${encodeURIComponent(errorMsg)}`);
      }

      // If not verified → remove old account and allow new register
      await User.deleteOne({ _id: existingUser._id });
    }

    // 2️⃣ Save new user

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit OTP

    const newUser = new User({
      givenName,
      surname,
      gender,
      dateOfBirth,
      username,
      email,
      password,

      verifyOTP: otp,
      verifyOTPExpire: Date.now() + 3 * 60 * 1000, // OTP expires in 3 minutes
    });

    await newUser.save();
    console.log('✅ User saved to MongoDB');

    const message = `
      <h2>Verify Your Email</h2>
      <p>Welcome to Chabalingo!</p>
      <p>Your verification code is:</p>

      <h1 style="letter-spacing:6px;">${otp}</h1>

      <p>This code expires in 3 minutes.</p>
      `;

    await transporter.sendMail({
      from: `"Chavalingo Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email - Chabalingo LMS",
      html: message,
    });

    return res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);

    // 3️⃣ Redirect with success message
    //return res.redirect('/register?success=Registration%20successful!%20Redirecting%20to%20login...');

  } catch (error) {
    console.error('❌ Registration error:', error);

    // Handle Mongo duplicate error (extra safety)
    if (error.code === 11000) {
      const dupField = Object.keys(error.keyPattern)[0];
      const errorMsg = dupField === 'username'
        ? 'Username already exists'
        : 'Email already exists';
      return res.redirect(`/register?error=${encodeURIComponent(errorMsg)}`);
    }

    // Default catch-all
    return res.redirect('/register?error=Server%20error');
  }
});

router.get("/verify-email", (req, res) => {
  res.render("verify-email", {
    email: req.query.email,
    messages: []
  });
});

// ============================
// EMAIL VERIFICATION
// ============================
router.post("/verify-email", async (req, res) => {
  const { email, otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;

  const enteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;

  const user = await User.findOne({
    email,
    verifyOTP: enteredOTP,
    verifyOTPExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.render("verify-email", {
      email,
      messages: ["❌ Invalid or expired OTP"]
    });
  }

  user.isVerified = true;
  user.verifyOTP = undefined;
  user.verifyOTPExpire = undefined;

  await user.save();

  res.redirect("/login?success=Email%20verified!%20You%20can%20now%20login.");
});

// ============================
// RESEND EMAIL VERIFICATION OTP
// ============================

router.post("/resend-verify-otp", async (req, res) => {
  try {

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/register?error=Account%20not%20found");
    }

    if (user.isVerified) {
      return res.redirect("/login?success=Email%20already%20verified");
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.verifyOTP = otp;
    user.verifyOTPExpire = Date.now() + 3 * 60 * 1000;

    await user.save();

    const message = `
      <h2>Email Verification</h2>
      <p>Your new verification code:</p>
      <h1 style="letter-spacing:6px;">${otp}</h1>
      <p>This code expires in 3 minutes.</p>
    `;

    await transporter.sendMail({
      from: `"Chavalingo Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "New Verification OTP - Chavalingo",
      html: message
    });

    res.redirect(`/verify-email?email=${encodeURIComponent(email)}`);

  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.redirect(`/verify-email?email=${encodeURIComponent(req.body.email)}`);
  }
});


// ============================
// LOGIN 
// ============================

router.get('/login', (req, res) => {
  res.render('login', { pageTitle: 'Login', error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1️⃣ Check if user exists
      const user = await User.findOne({
        $or: [
          { username: username },
          { email: username }
        ]
      });

    if (!user) {
      return res.render('login', {
        pageTitle: 'Login',
        error: '❌ Username or email not found.',
      });
    }

    if (!user.isVerified) {
      return res.render('login', {
        pageTitle: 'Login',
        error: '⚠️ Please verify your email before logging in.',
      });
    }

const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

if (
  user.role === 'user' &&
  user.status === 'active' &&
  user.archived === false &&
  user.lastLoginDate &&
  user.lastLoginDate < cutoffDate
) {
  user.status = 'deactivated';
  await user.save();
}

// 🛑 Block suspended accounts
if (user.status === 'suspended') {
  return res.render('account-blocked', {
    title: 'Account Suspended',
    message: 'Your account has been suspended.',
    reason: user.reasonSuspended || 'No reason provided.',
  });
}

if (user.status === 'deactivated') {
  return res.render('account-blocked', {
    title: 'Account Deactivated',
    message: 'Your account was deactivated due to inactivity.',
    reason: 'Please contact the administrator or reactivate your account.'
  });
}

if (user.archived === true) {
  return res.render('account-blocked', {
    title: 'Account Archived',
    message: 'Your account has been archived.',
    reason: user.reasonArchived || 'No reason provided.',
  });
}


    // 2️⃣ Compare password with hashed version
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('login', {
        pageTitle: 'Login',
        error: '❌ Incorrect password.',
      });
    }

    // 3️⃣ Store the **latest full user record** in session
    const fullUser = await User.findById(user._id).lean();
    req.session.user = fullUser;
    req.session.userId = fullUser._id;

    console.log('✅ Session Created:', req.session.user);

    // ⭐ 4️⃣ WELCOME NOTIFICATION TEST (ONLY RUNS ON FIRST LOGIN)
// 🎉 WELCOME NOTIFICATION CHECK (only runs on first login)
try {
  const Notification = require("../models/Notification");
  const freshUser = await User.findById(user._id).lean();

  // ✅ Only for regular users on their first login
  if (
    freshUser.role !== "admin" &&
    freshUser.notifEnabled &&
    (freshUser.loginDays === 0 || !freshUser.lastLoginDate)
  ) {
    // Check if a welcome notification already exists (just for safety)
    const alreadyHasWelcome = await Notification.findOne({
      userId: freshUser._id,
      message: { $regex: "Welcome to Chabalingo", $options: "i" }
    });

    if (!alreadyHasWelcome) {
      await Notification.create({
        userId: freshUser._id,
        message: "🎉 Welcome to Chabalingo! Thanks for joining us!"
      });
      console.log("✅ Welcome notification created for", freshUser.username);
    }
  }
} catch (notifErr) {
  console.log("⚠️ Notification Error:", notifErr);
}
    // ⭐ END OF NOTIFICATION TEST

    // 5️⃣ Redirect based on role
    
// 5️⃣ Redirect based on role
try {
  // ⭐ Update loginDays before session save
if (fullUser.role === 'user') {

  const today = new Date().toDateString();
  const lastLogin = user.lastLoginDate
    ? new Date(user.lastLoginDate).toDateString()
    : null;

  if (today !== lastLogin) {
    user.loginDays = (user.loginDays || 0) + 1;
    user.lastLoginDate = new Date();
  }

  await user.save();
}



  // ⭐ Store latest user info again after updating
  const updatedUser = await User.findById(user._id).lean();
  req.session.user = updatedUser;
  req.session.userId = updatedUser._id;

req.session.save(() => {
  if (updatedUser.role === 'admin') {
    console.log(`✅ Admin ${updatedUser.username} logged in!`);
    return res.redirect('/admin/dashboard');
  }

  if (updatedUser.role === 'linguist') {
    console.log(`📚 Linguist ${updatedUser.username} logged in!`);
    return res.redirect('/linguist/review');
  }

  // default: regular user
  console.log(`✅ User ${updatedUser.username} logged in!`);
  return res.redirect('/users/dashboard');
});


} catch (saveErr) {
  console.error("⚠️ Login day update failed:", saveErr);
  return res.redirect('/users/dashboard');
}

  } catch (err) {
    console.error('Login Error:', err);
    res.render('login', {
      pageTitle: 'Login',
      error: '⚠️ Something went wrong. Please try again later.',
    });
  }
});


// ============================
// FORGOT PASSWORD WITH OTP (Single Page Flow)
// ============================

// 1️⃣ Forgot Password page
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", {
    messages: [],
    email: "",        // ✅ define email by default
    showOTP: false,   // ✅ define showOTP by default
  });
});

// 2️⃣ Handle email + OTP flow
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;

    // 🔸 STEP 1: No OTP entered yet → user just typed their email
    if (!otp1 && !otp2 && !otp3 && !otp4 && !otp5 && !otp6) {
      const user = await User.findOne({ email });

      if (!user) {
        return res.render("forgot-password", {
          messages: ["❌ No account found with that email."],
          email: "",
          showOTP: false,
        });
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOTP = otp;
      user.resetOTPExpire = Date.now() + 3 * 60 * 1000; // expires in 3 mins
      await user.save();

      // Send OTP via email
      const message = `
        <h2>Password Reset Request</h2>
        <p>Use the following OTP to reset your password:</p>
        <h1 style="letter-spacing: 5px;">${otp}</h1>
        <p>This OTP will expire in 3 minutes.</p>
      `;

      await transporter.sendMail({
        from: `"Chavalingo Support" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset OTP - Chavalingo LMS",
        html: message,
      });

      // ✅ Re-render with OTP section visible
      return res.render("forgot-password", {
        messages: ["✅ OTP sent to your email. Please enter it below."],
        email,
        showOTP: true,
      });
    }

    // 🔸 STEP 2: OTP entered → verify OTP
    const enteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
    const user = await User.findOne({
      email,
      resetOTP: enteredOTP,
      resetOTPExpire: { $gt: Date.now() }, // ensure OTP is not expired
    });

    if (!user) {
      return res.render("forgot-password", {
        messages: ["❌ Invalid or expired OTP. Please request a new one."],
        email,
        showOTP: true,
      });
    }

    // ✅ OTP verified → clear it and show reset password form
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    await user.save();

    return res.render("reset-password", {
      email,
      messages: [],
    });
  } catch (error) {
    console.error("Error in forgot-password OTP flow:", error);
    res.render("forgot-password", {
      messages: ["⚠️ Something went wrong. Please try again later."],
      email: "",
      showOTP: false,
    });
  }
});

// 3️⃣ Reset Password submission
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("forgot-password", {
        messages: ["❌ No user found."],
        email: "",
        showOTP: false,
      });
    }

    // ⚙️ TODO: hash password before saving in production
    //throw new Error("💥 Simulated password reset failure for testing!");
    user.password = password;
    await user.save();

        // ✅ Render success message with redirect notice
    return res.render("reset-success", {
      email,
      successMessage: "✅ Password reset successful! Redirecting to login...",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
        return res.render("reset-error", {
      errorMessage: "⚠️ Something went wrong while resetting your password. Please try again later.",
    });
  }
});




// LOGOUT
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout Error:', err);
      return res.send('❌ Error logging out.');
    }
    res.clearCookie('connect.sid'); // clear session cookie
    res.redirect('/login');
  });
});

module.exports = router;