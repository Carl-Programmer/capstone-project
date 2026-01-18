const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const LessonProgress = require("../models/LessonProgress");
const { updateCourseProgress } = require("../controllers/courseController");
const { isAuthenticated } = require('../middleware/auth');
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const { sendNotification } = require("../utils/notify");
const QuizAttempt = require('../models/QuizAttempt');


router.get('/users/dashboard', isAuthenticated, async (req, res) => {
  try {

    const user = await User.findById(req.session.user._id);
    const userId = user._id;


    // Enrollments for this user
    const enrollments = await Enrollment.find({ userId }).lean();
    const totalEnrolled = enrollments.length;

    // Certificates (courses completed)
    const certificates = user.certificates?.length || 0;


    // Login days (placeholder or real logic)
    const loginDays = user.loginDays || 0;


    // My Courses table
    const myCourses = await Promise.all(
      enrollments.map(async (e, i) => {
        const course = await Course.findById(e.courseId).lean();
        return {
          index: i + 1,
          title: course?.title || 'Unknown Course',
          progress: e.progress || 0
        };
      })
    );

// ===========================
// 🔹 Pending Activity (1 lesson only)
// ===========================
let pendingActivity = null;

for (const e of enrollments) {
  const course = await Course.findById(e.courseId).lean();
  if (!course) continue;

  // 🧩 Get all active lessons for this course (sorted)
  const lessons = await Lesson.find({
    courseId: course._id,
    isArchived: { $ne: true }
  })
  .sort({ createdAt: 1 })
  .lean();

  for (const lesson of lessons) {
    // Has the user completed this lesson?
    const progress = await LessonProgress.findOne({
      userId,
      lessonId: lesson._id,
      isCompleted: true
    }).lean();

    if (!progress) {
      // ✅ Found the first incomplete lesson → stop here
      pendingActivity = {
        type: 'lesson',
        lessonTitle: lesson.title,
        courseTitle: course.title,
        lessonId: lesson._id,
        courseId: course._id
      };
      break;
    }
  }

  if (pendingActivity) break; // stop after finding first pending lesson
}


    res.render('users/dashboard', {
      pageTitle: 'Dashboard',
      user: req.session.user,
      totalEnrolled,
      certificates,
      loginDays,
      myCourses,
      pendingActivity 
    });

  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).send("Server error loading dashboard");
  }
});



// 📘 GET /courses – list all courses
router.get('/courses', async (req, res) => {
  try {
    const userId = req.session?.user?._id || null;

    const courses = await Course.find({archived: {$ne: true}}).lean();

    // Lesson counts per course (exclude archived)
    const lessonsCountPromises = courses.map(c => 
      Lesson.countDocuments({
        courseId: c._id,
        isArchived: { $ne: true }
      })
    );

    const lessonsCounts = await Promise.all(lessonsCountPromises);

    const lessonsCountMap = {};
    courses.forEach((c, i) => {
      lessonsCountMap[c._id.toString()] = lessonsCounts[i] || 0;
    });

    // Enrollment progress
    let enrolledIds = [];
    const progressMap = {};
    if (userId) {
      const enrollments = await Enrollment.find({ userId }).lean();
      enrolledIds = enrollments.map(e => e.courseId.toString());
      enrollments.forEach(e => {
        progressMap[e.courseId.toString()] = e.progress || 0;
      });
    }

    // Mark 0% progress for unenrolled courses
    courses.forEach(course => {
      const idStr = course._id.toString();
      if (!enrolledIds.includes(idStr)) progressMap[idStr] = 0;
    });

    res.render('users/courses', {
      pageTitle: 'Courses',
      courses,
      lessonsCountMap,
      enrolledIds,
      progressMap
    });
  } catch (err) {
    console.error('Error loading courses:', err);
    res.status(500).send('Server error');
  }
});


// 🟠 POST /courses/enroll/:id – enroll user into a course
router.post('/courses/enroll/:id', async (req, res) => {
  try {
    const userId = req.session?.user?._id;
    if (!userId) return res.redirect('/login');

    const courseId = req.params.id;

    const existing = await Enrollment.findOne({ userId, courseId });
    if (!existing){
       await Enrollment.create({ userId, courseId, progress: 0 });

    const user = await User.findById(userId).lean();
    const course = await Course.findById(courseId).lean();

          if (user.notifEnabled) {
        await sendNotification({
          userId: user._id,
          message: `📘 You enrolled in the course: ${course.title}`,
        });
      }
    }

    req.session.message = '✅ Successfully enrolled in course!';
    res.redirect(`/courses/${courseId}/view`);
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).send('Server error');
  }
});


// 📗 GET /courses/:id/view – view specific course + lessons
// 📗 GET /courses/:id/view – USER view specific course + lessons
router.get('/courses/:id/view', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).send('Course not found');

    const lessons = await Lesson.find({
      courseId: course._id,
      isArchived: { $ne: true }   // ⬅ exclude archived lessons
    })
    .sort({ createdAt: 1 })
    .lean();

    const total = lessons.length;  // now counts ONLY active lessons

    const userId = req.session?.user?._id || null;
    let enrollment = null;
    let completedLessons = [];

    if (userId) {

    // ✅ Check if user is enrolled first
    const existingEnrollment = await Enrollment.findOne({
      userId,
      courseId: course._id
    });

  if (existingEnrollment) {
    // 🔥 Only recalc if enrolled
    await updateCourseProgress(userId, course._id);
    enrollment = await Enrollment.findOne({
      userId,
      courseId: course._id
    }).lean();
  }

      // 🔥 Fetch completed lesson IDs
      const completed = await LessonProgress.find({
        userId,
        isCompleted: true
      }).select("lessonId");

      completedLessons = completed.map(l => l.lessonId.toString());
    }

    // Render course page (you keep admin view)
    res.render('admin/viewCourse', {
      pageTitle: course.title,
      user: req.session.user,
      course,
      lessons,
      enrollment,
      completedLessons,
      total
    });

  } catch (err) {
    console.error('Error loading course view:', err);
    res.status(500).send('Server error');
  }
});


// 🧭 Redirect /courses/:id → /courses/:id/view
router.get('/courses/:id', (req, res) => {
  res.redirect(`/courses/${req.params.id}/view`);
});

// ============================
// QUIZ LANDING PAGE
// ============================
// 🧩 GET /users/quiz/:lessonId – quiz landing page
// ✅ QUIZ LANDING PAGE
router.get('/users/quiz/:lessonId', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).lean();
    if (!lesson) return res.status(404).send('Lesson not found.');

    const quiz = await Quiz.findOne({ lessonId: lesson._id }).lean();
    if (!quiz) return res.status(404).send('Quiz not found for this lesson.');

    // ✅ Ensure passingGrade exists (default to 7.0 if missing)
    if (quiz.passingGrade === undefined || quiz.passingGrade === null) {
      quiz.passingGrade = 7.0;
    }

    // ✅ Fetch previous attempts for the logged-in user
    const attempts = await QuizAttempt.find({
      userId: req.session.user._id,
      quizId: quiz._id
    })
      .sort({ takenAt: -1 })
      .limit(5)
      .lean();

const formattedAttempts = attempts.map(a => ({
  ...a,
  takenAtPH: new Date(a.takenAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Manila'
  })
}));

    res.render('users/quizLanding', {
      lesson,
      quiz,
      attempts: formattedAttempts,
      pageTitle: `Quiz - ${lesson.title}`,
    });
  } catch (err) {
    console.error('Error loading quiz:', err);
    res.status(500).send('Error loading quiz');
  }
});


// 🧩 GET /users/quiz/:lessonId – take quiz
router.get('/users/quiz/:lessonId', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId).lean();
    if (!lesson) return res.status(404).send('Lesson not found.');

    const quiz = await Quiz.findOne({ lessonId: lesson._id }).lean();
    if (!quiz) return res.status(404).send('Quiz not found for this lesson.');

    res.render('users/takeQuiz', {
      lesson,
      quiz,
      pageTitle: `Quiz - ${lesson.title}`
    });
  } catch (err) {
    console.error('Error loading quiz:', err);
    res.status(500).send('Error loading quiz');
  }
});

// 🧩 GET /users/quiz/:quizId/start – start taking the quiz
router.get('/users/quiz/:quizId/start', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId).lean();
    if (!quiz) return res.status(404).send('Quiz not found.');

    const lesson = await Lesson.findById(quiz.lessonId).lean();
    if (!lesson) return res.status(404).send('Lesson not found.');

    res.render('users/takeQuiz', {
      lesson,
      quiz,
      timeLimit: quiz.timeLimit, // already stored in seconds
      pageTitle: `Quiz - ${lesson.title}`
    });
  } catch (err) {
    console.error('Error loading quiz start page:', err);
    res.status(500).send('Error loading quiz start page');
  }
});


// ============================
// Submit Quiz Route
// ============================

router.post('/users/quiz/:lessonId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ lessonId: req.params.lessonId });
    if (!quiz) return res.status(404).send('Quiz not found');

    const answers = req.body || {};
    let score = 0;

    quiz.questions.forEach((q, i) => {
      const userAnswer = (answers[`q${i}`] || '').trim();
      const correct = (q.correctAnswer || '').trim();
      if (userAnswer && userAnswer.toLowerCase() === correct.toLowerCase()) score++;
    });

    const total = quiz.questions.length || 1;
    const percentage = (score / total) * 100;

    const userId = req.session.user._id;

    // ⬇️ We only fetch the lesson ONCE
    const lesson = await Lesson.findById(quiz.lessonId).lean();
    const courseId = lesson ? lesson.courseId : null;

        // 🟩 Record attempt in QuizAttempt collection
    await QuizAttempt.create({
      userId,
      quizId: quiz._id,
      lessonId: quiz.lessonId,
      score,
      totalScore: total,
      percentage,
      status: percentage >= (quiz.passingGrade * 10) ? 'Passed' : 'Failed',
      takenAt: new Date()
    });

    // 🎯 PASS REQUIREMENT
    if (percentage >= 70) {
      await LessonProgress.findOneAndUpdate(
        { userId, lessonId: quiz.lessonId },
        {
          isCompleted: true,
          completedAt: new Date(),
          courseId: courseId  // 🔥 REQUIRED
        },
        { upsert: true }
      );


      // 🔥 UPDATE COURSE PROGRESS
      if (courseId) {
        await updateCourseProgress(userId, courseId);
      }
    }

    // Render result page
    res.render('users/quizResult', {
      quiz,
      score,
      total,
      percentage,
      passed: percentage >= 70,
      pageTitle: 'Quiz Results',
      courseId // pass for redirecting back to course page
    });

  } catch (err) {
    console.error('Error submitting quiz:', err);
    res.status(500).send('Error submitting quiz');
  }
});

// ============================
// Lesson Completion Route
// ============================

router.post("/lesson/complete/:lessonId", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const lessonId = req.params.lessonId;

    const lesson = await Lesson.findById(lessonId);

    // Save completion
    await LessonProgress.findOneAndUpdate(
      { userId, lessonId },
      {
        isCompleted: true,
        completedAt: new Date(),
        courseId: lesson.courseId   // 🔥 REQUIRED
      },
      { upsert: true }
    );


    // update course progress
    const progress = await updateCourseProgress(userId, lesson.courseId);

    res.json({ success: true, progress });
  } catch (err) {
    console.log(err);
    res.json({ success: false, error: err.message });
  }
});

// ============================
// Get Course Progress Route
// ============================

router.get("/api/course-progress/:courseId", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const courseId = req.params.courseId;

    // recalc always
    await updateCourseProgress(userId, courseId);

    // get updated enrollment
    const enrollment = await Enrollment.findOne({ userId, courseId }).lean();

    // get completed lessons
    const completed = await LessonProgress.find({
      userId,
      isCompleted: true
    }).select("lessonId");

    const completedLessons = completed.map(x => x.lessonId.toString());

    res.json({
      success: true,
      progress: enrollment.progress,
      completedLessons
    });

  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ============================
// FINAL EXAM LANDING PAGE
// ============================
router.get("/users/final-exam/:courseId", async (req, res) => {
  try {
    // 🔹 Find the final exam quiz for this course
    const quiz = await Quiz.findOne({
      courseId: req.params.courseId,
      isFinalExam: true,
    });

    if (!quiz) return res.status(404).send("Final exam not found");

    // 🔹 Get the course info
    const course = await Course.findById(req.params.courseId);

    // 🔹 Fetch previous attempts (limit to last 5)
    const attempts = await QuizAttempt.find({
      userId: req.session.user._id,
      quizId: quiz._id,
      type: "FinalExam",
    })
      .sort({ takenAt: -1 })
      .limit(5)
      .lean();

    // 🔹 Convert all attempt timestamps to Philippine time (Asia/Manila)
    const formattedAttempts = attempts.map((a) => ({
      ...a,
      takenAtPH: new Date(a.takenAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }),
    }));

    // 🔹 Render the landing page
    res.render("users/finalExamLanding", {
      course,
      quiz,
      attempts: formattedAttempts, // ✅ use formatted date
      pageTitle: "Final Exam",
    });
  } catch (err) {
    console.error("❌ Error loading Final Exam Landing:", err);
    res.status(500).send("Server error while loading exam");
  }
});




// ============================
// FINAL EXAM START PAGE (actual exam UI)
// ============================
router.get('/users/final-exam/:courseId/start', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      courseId: req.params.courseId,
      isFinalExam: true
    });

    if (!quiz) return res.status(404).send("Final exam not found");

    const course = await Course.findById(req.params.courseId);

    res.render("users/takeFinalExam", { 
      course, 
      quiz,
      timeLimit: (course.examSettings?.timeLimit || 120) * 60, // always minutes → seconds
      pageTitle: "Final Exam"
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// ============================
// FINAL EXAM SUBMISSION ROUTE
// ============================
const generateCertificate = require("../utils/certificateGenerator");

router.post("/users/final-exam/:courseId/submit", async (req, res) => {
  try {
    const courseId = req.params.courseId;

    // 🔹 Find the final exam quiz for this course
    const quiz = await Quiz.findOne({
      courseId,
      isFinalExam: true,
    });
    if (!quiz) return res.status(404).send("Exam not found");

    const course = await Course.findById(courseId);
    const user = await User.findById(req.session.user?._id);

    if (!user) return res.status(401).send("Please log in first.");

    // 🔹 Calculate the score
    const answers = req.body || {};
    let score = 0;

    quiz.questions.forEach((q, i) => {
      const userAnswer = (answers[`q${i}`] || "").trim();
      if (userAnswer === q.correctAnswer.trim()) score++;
    });

    const total = quiz.questions.length;
    const percentage = (score / total) * 100;
    const passed = percentage >= 70;

    // ✅ SAVE FINAL EXAM ATTEMPT
    await QuizAttempt.create({
      userId: req.session.user._id,
      quizId: quiz._id,
      lessonId: null,  // 🏷️ no specific lesson
      type: "FinalExam",     // 🏷️ tag as FinalExam
      score,
      totalScore: total,
      percentage,
      status: passed ? "Passed" : "Failed",
    });

// ==============================
// 🏅 Generate certificate if passed
// ==============================
if (passed) {
  let templateFile = course.certificateFile || "default-template.pdf";
  let templatePath = path.join(__dirname, "..", "public", "uploads", "certificates", templateFile);


// 🔎 Check if template actually exists
if (!fs.existsSync(templatePath)) {
  console.warn(`⚠️ Certificate template not found: ${templateFile}, using fallback template.`);
  templateFile = "1764336652379-BLANK-CERTICATE.pdf"; // ✅ matches your actual filename
  templatePath = path.join(__dirname, "..", "public", "uploads", "certificates", templateFile);
}


  const alreadyHas = user.certificates.some(
    (c) => c.courseId.toString() === courseId
  );

  if (!alreadyHas) {
    const outputFile = `${user._id}-${courseId}.pdf`;

    const certDate = new Date();
    const certId = `CHABA-${user._id.toString().slice(-6).toUpperCase()}-${certDate.getFullYear()}${String(
      certDate.getMonth() + 1
    ).padStart(2, "0")}${String(certDate.getDate()).padStart(2, "0")}`;

    await generateCertificate({
      userName: `${user.givenName} ${user.surname}`,
      courseTitle: course.title,
      date: certDate.toLocaleDateString(),
      certificateId: certId,
      templateFile, // ✅ uses fallback-safe file
      outputFile,
    });

    user.certificates.push({
      courseId,
      file: "generated/" + outputFile,
      dateIssued: certDate,
      certificateId: certId,
    });

    await user.save();
    
    if (user.notifEnabled) {
      await sendNotification({
        userId: user._id,
        message: `🏅 You earned a certificate for completing "${course.title}"!`,
        link: "/users/certificates"
      });
      console.log("📣 Certificate notification sent!");
    } else {
      console.log("🔕 Notifications disabled — certificate notif skipped");
    }
  }
}


    // ==============================
    // 📊 Render result page
    // ==============================
    res.render("users/examResult", {
      courseId,
      score,
      total,
      percentage,
      passed,
      course,
      pageTitle: "Final Exam Result",
    });
  } catch (err) {
    console.error("❌ Final exam submission error:", err);
    res.status(500).send("Server error");
  }
});


// ============================
// User Certificates Route
// ============================

router.get('/users/certificates', async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  const user = await User.findById(req.session.user._id)
    .populate("certificates.courseId");

  if (!user) return res.redirect('/login');

  res.render("users/certificates", {
    certs: user.certificates || [],
    pageTitle: "Certificates"
  });
});



// ============================
// User Profile Routes
// ============================

// GET profile page
// ✅ Profile Page – View & Edit
router.get('/users/profile', async (req, res) => {
  try {
    const userSession = req.session.user;
    if (!userSession) return res.redirect('/login');

    // Fetch full user from DB (in case session is outdated)
    const User = require('../models/User');
    const user = await User.findById(userSession._id).lean();

    if (!user) return res.redirect('/login');

    res.render('users/profile', {
      pageTitle: 'My Profile',
      user
    });
  } catch (err) {
    console.error('Error loading profile page:', err);
    res.status(500).send('Server error loading profile page.');
  }
});

// Storage engine
const storage = multer.diskStorage({
  destination: "./public/uploads/avatars/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Only accept images
function fileFilter(req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  cb(null, allowed.includes(file.mimetype));
}

const upload = multer({ storage, fileFilter });

// POST: Update Profile (with avatar upload)
router.post('/users/updateProfile', upload.single("avatar"), async (req, res) => {
  try {
    const User = require('../models/User');
    const userId = req.session.user._id;

    const { givenName, surname, gender, dateOfBirth, email } = req.body;

    const updateData = {
      givenName,
      surname,
      gender,
      dateOfBirth,
      email
    };

    if (req.file) {
      updateData.avatar = req.file.filename;
    }

    await User.findByIdAndUpdate(userId, updateData);

    // Refresh session
    const updatedUser = await User.findById(userId).lean();
    req.session.user = updatedUser;

    // ✅ Notify user of profile update
    if (updatedUser.notifEnabled) {
    await sendNotification({
    userId,
    message: "✅ Your profile has been changed successfully.",
    });
  }
    // FIX: Ensure session updates before redirect
    req.session.save(() => {
      res.redirect('/users/profile');
    });

  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).send('Server error updating profile.');
  }
});

// ============================
// Delete Profile Picture Route
// ============================
// POST: Delete Profile Picture
router.post('/users/deleteAvatar', async (req, res) => {
  try {
    const User = require('../models/User');
    const fs = require('fs');
    const path = require('path');
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    if (user && user.avatar) {
      const filePath = path.join(__dirname, '../public/uploads/avatars/', user.avatar);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // 🧹 delete old file
    }

    // revert avatar to default
    user.avatar = null;
    await user.save();

    // refresh session
    req.session.user = user;
    req.session.save(() => res.status(200).send('Avatar deleted'));

  } catch (err) {
    console.error('Error deleting avatar:', err);
    res.status(500).send('Server error deleting avatar');
  }
});


// ============================
// Change Password Routes
// ============================

// GET Change Password page
router.get('/users/change-password', (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const message = req.session.message || null;
  delete req.session.message; // clear it after showing once

  res.render('users/changePassword', {
    pageTitle: 'Change Password',
    user: req.session.user,
    message
  });
});


// POST Change Password logic
router.post('/users/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.user?._id;

    const user = await User.findById(userId);
    if (!user) {
      req.session.message = '❌ User not found.';
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      req.session.message = '❌ Incorrect current password.';
      return res.redirect('/users/change-password');
    }

    if (newPassword !== confirmPassword) {
      req.session.message = '❌ Passwords do not match.';
      return res.redirect('/users/change-password');
    }

    // ❗ Do NOT hash here — let mongoose pre-save handle it
    user.password = newPassword;
    await user.save();

    req.session.message = '✅ Password successfully updated!';
    res.redirect('/users/change-password');

  } catch (err) {
    console.error('💥 Error changing password:', err);
    req.session.message = '❌ Server error changing password.';
    res.redirect('/users/change-password');
  }
});

// ✅ GET /users/search?q=... – dynamic search suggestions
// ✅ GET /users/search?q=... – dynamic search suggestions
router.get('/users/search', async (req, res) => {
  const q = req.query.q?.toLowerCase() || "";
  if (!q) return res.json({ suggestions: [] });

  const Lesson = require('../models/Lesson');
  const Course = require('../models/Course');

  const [lessons, courses] = await Promise.all([
    Lesson.find({ title: { $regex: q, $options: "i" }, isArchived: false })
      .select("title courseId")
      .limit(5)
      .lean(),
    Course.find({ title: { $regex: q, $options: "i" }, archived: false })
      .select("title")
      .limit(5)
      .lean()
  ]);

  res.json({
    suggestions: [
      ...lessons.map(l => ({
        type: "Lesson",
        text: l.title,
        id: l._id,
        courseId: l.courseId // 🧩 important for redirect
      })),
      ...courses.map(c => ({
        type: "Course",
        text: c.title,
        id: c._id
      }))
    ]
  });
});



// ✅ GET /users/notifications – fetch latest notifications
router.get('/users/notifications', async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    const notifications = await Notification
      .find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId: req.session.user._id,
      isRead: false
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.json({ success: false, notifications: [], unreadCount: 0 });
  }
});

router.post('/users/notifications/mark-read', async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    await Notification.updateMany(
      { userId: req.session.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});

router.delete('/users/notifications/delete/:id', async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    await Notification.deleteOne({
      _id: req.params.id,
      userId: req.session.user._id
    });

    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
});


router.post('/users/notifications/toggle', isAuthenticated, async (req, res) => {
  const { enabled } = req.body;

  await User.findByIdAndUpdate(req.session.user._id, { notifEnabled: enabled });

  res.json({ message: "Notification preference saved" });
});

router.get('/users/notifications/status', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.user._id).lean();
  res.json({ enabled: user.notifEnabled });
});

// 📌 Full page: "View All Notifications"
router.get('/users/notifications/all', async (req, res) => {
  try {
    const Notification = require('../models/Notification');

    const notifications = await Notification
      .find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.render('users/notifications', {
      pageTitle: 'Notifications',
      notifications
    });
  } catch (err) {
    res.render('users/notifications', {
      pageTitle: 'Notifications',
      notifications: []
    });
  }
});

module.exports = router;
